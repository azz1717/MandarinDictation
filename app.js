let allPhrases = [];
let currentPhrase = null;
let currentTerm = null;
let currentWeek = null;
let audioPlayer = null;

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
}

// Select random phrase
function selectRandomPhrase() {
    const randomIndex = Math.floor(Math.random() * allPhrases.length);
    const selection = allPhrases[randomIndex];

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

    document.getElementById("answer-screen").classList.add("hidden");
    document.getElementById("test-screen").classList.remove("hidden");

    audioPlayer = new Audio("audio/" + currentPhrase.audio);
}

// Show answer screen
function showAnswer() {
    document.getElementById("answer-term-week").textContent =
        `Term ${currentTerm} - Week ${currentWeek}`;

    document.getElementById("answer-image").src = "images/" + currentPhrase.image;
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