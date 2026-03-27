let allPhrases = [];
let currentPhrase = null;
let currentTerm = null;
let currentWeek = null;
let audioPlayer = null;
let currentFilterTerm = "all"; // New: tracks the active filter

// Flatten dataset into a single array
function initializePhrases() {
    dataset.weeks.forEach(weekObj => {
        weekObj.phrases.forEach(phrase => {
            if (phrase.chinese && phrase.audio && phrase.image) {
                allPhrases.push({
                    term: weekObj.term,
                    week: weekObj.week,
                    phrase: phrase
                });
            }
        });
    });

    // New: Extract unique terms and populate the dropdown
    const uniqueTerms = new Set(allPhrases.map(item => String(item.term)));
    const filterSelect = document.getElementById("term-filter");
    
    if (filterSelect) {
        uniqueTerms.forEach(term => {
            const option = document.createElement("option");
            option.value = term;
            option.textContent = `Term ${term}`;
            filterSelect.appendChild(option);
        });

        // New: Listen for filter changes
        filterSelect.addEventListener("change", (e) => {
            currentFilterTerm = e.target.value;
            selectRandomPhrase(); // Pick a new phrase when the filter changes
        });
    }
}

// Select random phrase
function selectRandomPhrase() {
    // New: Filter the phrases based on the selected term
    const filteredPhrases = currentFilterTerm === "all" 
        ? allPhrases 
        : allPhrases.filter(item => String(item.term) === currentFilterTerm);

    // Safety check just in case a filter returns empty
    if (filteredPhrases.length === 0) return;

    // Use filteredPhrases instead of allPhrases for the random selection
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
        // Chinese punctuation to preserve
        const punctuation = "，。？！；：、“”‘’（）";
        
        if (punctuation.includes(char)) {
            return char;
        }

        // Preserve spaces
        if (char.trim() === "") {
            return char;
        }

        // Replace all other characters with underscore
        return "_";
    }).join(" ");
}

// Update test screen
function updateTestScreen() {
    document.getElementById("term-week").textContent =
        `Term ${currentTerm} - Week ${currentWeek}`;
        
    document.getElementById("sentence-structure").textContent =
    maskSentence(currentPhrase.chinese);
    
    document.getElementById("answer-image").src = "images/" + currentPhrase.image;

    document.getElementById("answer-screen").classList.add("hidden");
    document.getElementById("test-screen").classList.remove("hidden");

    audioPlayer = new Audio("audio/" + currentPhrase.audio);
}

// Show answer screen
function showAnswer() {
    document.getElementById("answer-term-week").textContent =
        `Term ${currentTerm} - Week ${currentWeek}`;

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
    updateTestScreen(); // same phrase, no re-randomizing
});

document.getElementById("new-btn").addEventListener("click", () => {
    selectRandomPhrase();
});

// Initialize
initializePhrases();
selectRandomPhrase();