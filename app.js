let allPhrases = [];
let currentPhrase = null;
let currentTerm = null;
let currentWeek = null;
let audioPlayer = null;
let currentFilterTerm = "all";

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
                    // Replaced image requirement with chinese requirement
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

// Populate the dropdown filter
function populateFilters() {
    const uniqueTerms = new Set(allPhrases.map(item => String(item.term)));
    const filterSelect = document.getElementById("term-filter");
    
    if (filterSelect) {
        uniqueTerms.forEach(term => {
            const option = document.createElement("option");
            option.value = term;
            option.textContent = `Term ${term}`;
            filterSelect.appendChild(option);
        });

        filterSelect.addEventListener("change", (e) => {
            currentFilterTerm = e.target.value;
            selectRandomPhrase(); 
        });
    }
}

// Select random phrase
function selectRandomPhrase() {
    const filteredPhrases = currentFilterTerm === "all" 
        ? allPhrases 
        : allPhrases.filter(item => String(item.term) === currentFilterTerm);

    if (filteredPhrases.length === 0) return;

    const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
    const selection = filteredPhrases[randomIndex];

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
    
    // Removed image source update logic

    document.getElementById("answer-screen").classList.add("hidden");
    document.getElementById("test-screen").classList.remove("hidden");

    audioPlayer = new Audio("audio/" + currentPhrase.audio);
}

// Show answer screen
function showAnswer() {
    document.getElementById("answer-term-week").textContent =
        `Term ${currentTerm} - Week ${currentWeek}`;

    // Populates the new text container instead of an image
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