let allPhrases = [];
let currentPhrase = null;
let currentTerm = null;
let currentWeek = null;
let audioPlayer = null;
let currentFilterTerm = "all";
let selectedWeeks = new Set(); // Tracks active week checkboxes
let deck = []; // Shuffled queue of phrases for the current filter selection
let deckKey = null; // Signature of the filter selection the deck was built for

// Fetch dataset structure and load individual term files
async function initializeData() {
    try {
        const indexRes = await fetch('index.json');
        const indexData = await indexRes.json();
        
        const loadedFiles = {};

        for (const weekMeta of indexData.weeks) {
            const file = weekMeta.file;
            const term = weekMeta.term;
            const week = weekMeta.week;

            if (!loadedFiles[file]) {
                const termRes = await fetch(`data/${file}`);
                loadedFiles[file] = await termRes.json();
            }

            const termData = loadedFiles[file];
            if (termData.weeks && termData.weeks[week]) {
                termData.weeks[week].phrases.forEach(phrase => {
                    if (phrase.chinese && phrase.audio) {
                        allPhrases.push({
                            term: term,
                            week: week,
                            phrase: phrase
                        });
                    }
                });
            }
        }

        populateFilters();
        selectRandomPhrase();
    } catch (err) {
        console.error("Failed to load datasets:", err);
    }
}

// Populate term dropdown and trigger week checkbox generation
function populateFilters() {
    const uniqueTerms = Array.from(
        new Set(allPhrases.map(item => String(item.term)))
    ).sort((a, b) => Number(a) - Number(b));

    const filterSelect = document.getElementById("term-filter");
    
    if (filterSelect) {
        // Clear options while maintaining 'all'
        filterSelect.innerHTML = '<option value="all">All Terms</option>';

        uniqueTerms.forEach(term => {
            const option = document.createElement("option");
            option.value = term;
            option.textContent = `Term ${term}`;
            filterSelect.appendChild(option);
        });

        filterSelect.addEventListener("change", (e) => {
            currentFilterTerm = e.target.value;
            selectedWeeks.clear(); // Reset week selection when term changes
            populateWeekFilters();
            selectRandomPhrase(); 
        });
    }

    populateWeekFilters();
}

// Generate checkboxes for available weeks based on current term selection
function populateWeekFilters() {
    const weekContainer = document.getElementById("week-filter-container");
    if (!weekContainer) return;

    weekContainer.innerHTML = "";

    // Filter available weeks by active term
    const availableWeeks = new Set(
        allPhrases
            .filter(item => currentFilterTerm === "all" || String(item.term) === currentFilterTerm)
            .map(item => String(item.week))
    );

    const sortedWeeks = Array.from(availableWeeks).sort((a, b) => Number(a) - Number(b));

    if (sortedWeeks.length === 0) return;

    // Header title for checkboxes
    const title = document.createElement("span");
    title.style.display = "block";
    title.style.fontWeight = "bold";
    title.style.margin = "8px 0 4px 0";
    title.textContent = "Filter Weeks (leave unselected for all):";
    weekContainer.appendChild(title);

    // Create checkbox for each available week
    sortedWeeks.forEach(week => {
        const label = document.createElement("label");
        label.style.marginRight = "12px";
        label.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = week;
        checkbox.checked = selectedWeeks.has(week);

        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                selectedWeeks.add(e.target.value);
            } else {
                selectedWeeks.delete(e.target.value);
            }
            selectRandomPhrase();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` Week ${week}`));
        weekContainer.appendChild(label);
    });
}

// Fisher-Yates shuffle; returns a new array, leaves the input untouched
function shuffleArray(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Deal the next phrase matching both term AND week selections from a
// shuffled deck, so every phrase in the current selection is shown once
// before any phrase repeats (instead of an independent random draw each
// time, which can repeat the same phrase in short succession).
function selectRandomPhrase() {
    const filteredPhrases = allPhrases.filter(item => {
        const matchesTerm = currentFilterTerm === "all" || String(item.term) === currentFilterTerm;
        const matchesWeek = selectedWeeks.size === 0 || selectedWeeks.has(String(item.week));
        return matchesTerm && matchesWeek;
    });

    if (filteredPhrases.length === 0) {
        document.getElementById("sentence-structure").textContent = "No phrases found for selection.";
        return;
    }

    const poolKey = currentFilterTerm + "|" + Array.from(selectedWeeks).sort().join(",");

    // Rebuild (reshuffle) the deck whenever the term/week selection has
    // changed, or once the current deck has been fully dealt through.
    if (poolKey !== deckKey || deck.length === 0) {
        deck = shuffleArray(filteredPhrases);

        // Guard against dealing the same phrase twice in a row across a
        // reshuffle boundary (deck.pop() deals from the end, so the next
        // card to be dealt is deck[deck.length - 1]).
        const next = deck[deck.length - 1];
        if (deck.length > 1 && currentPhrase && next.phrase === currentPhrase) {
            [deck[deck.length - 1], deck[0]] = [deck[0], deck[deck.length - 1]];
        }

        deckKey = poolKey;
    }

    const selection = deck.pop();

    currentPhrase = selection.phrase;
    currentTerm = selection.term;
    currentWeek = selection.week;

    updateTestScreen();
}

// Create blanked out sentence template
function maskSentence(chineseText) {
    return chineseText.split("").map(char => {
        const punctuation = "，。？！；：、“”‘’（）";
        
        if (punctuation.includes(char)) {
            return char;
        }

        if (char.trim() === "") {
            return char;
        }

        return "_";
    }).join(" ");
}

// Update test screen
function updateTestScreen() {
    document.getElementById("term-week").textContent =
        `Term ${currentTerm} - Week ${currentWeek}`;
        
    document.getElementById("sentence-structure").textContent =
        maskSentence(currentPhrase.chinese);

    document.getElementById("answer-screen").classList.add("hidden");
    document.getElementById("test-screen").classList.remove("hidden");

    audioPlayer = new Audio("audio/" + currentPhrase.audio);
}

// Show answer screen
function showAnswer() {
    document.getElementById("answer-term-week").textContent =
        `Term ${currentTerm} - Week ${currentWeek}`;

    document.getElementById("answer-chinese").textContent = currentPhrase.chinese;
    document.getElementById("answer-english").textContent = currentPhrase.english;

    document.getElementById("test-screen").classList.add("hidden");
    document.getElementById("answer-screen").classList.remove("hidden");
}

// Event listeners
document.getElementById("play-btn").addEventListener("click", () => {
    if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    }
});

document.getElementById("answer-btn").addEventListener("click", showAnswer);

document.getElementById("retry-btn").addEventListener("click", () => {
    updateTestScreen(); 
});

document.getElementById("new-btn").addEventListener("click", () => {
    selectRandomPhrase();
});

// Initialize
initializeData();