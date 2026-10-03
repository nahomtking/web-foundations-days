let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" }
];

function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

console.log(searchNotes("project"));
// Expected: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

console.log(searchNotes("PROJECT"));
// Expected: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

console.log(searchNotes("pizza"));
// Expected: []
function longestNote() {
    return notes.reduce((longest, note) => {
        if (longest === null || note.text.length > longest.text.length) {
            return note;
        }

        return longest;
    }, null);
}
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

let savedNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = savedNotes;
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;
        }
    }

    return counts;
}
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

let savedNotesForCount = notes;
notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotesForCount;
function getSummary() {
    return {
        total: notes.length,
        byCategory: countByCategory(),
        longest: longestNote()
    };
}
console.log(getSummary());
// Expected:
// {
//     total: 5,
//     byCategory: { personal: 2, study: 2, work: 1 },
//     longest: { id: 3, text: "Email the project report to Grace", category: "work" }
// }

let savedNotesForSummary = notes;
notes = [];

console.log(getSummary());
// Expected: { total: 0, byCategory: {}, longest: null }

notes = savedNotesForSummary;
function isDuplicate(text) {
    return notes.some(note =>
        note.text.toLowerCase() === text.toLowerCase()
    );
}
console.log(isDuplicate("Buy milk and bread"));
// Expected: true

console.log(isDuplicate("BUY MILK AND BREAD"));
// Expected: true

console.log(isDuplicate("Buy eggs"));
// Expected: false
function addNote(text, category) {
    if (!text.trim() || isDuplicate(text)) {
        return null;
    }

    let nextId = notes.length > 0
        ? Math.max(...notes.map(note => note.id)) + 1
        : 1;

    let newNote = {
        id: nextId,
        text: text.trim(),
        category: category
    };

    notes.push(newNote);

    return newNote;
}
console.log(addNote("Plan weekend trip", "personal"));
// Expected: { id: 6, text: "Plan weekend trip", category: "personal" }

console.log(addNote("BUY MILK AND BREAD", "personal"));
// Expected: null

console.log(addNote("   ", "personal"));
// Expected: null

console.log(notes);
// Expected: original 5 notes plus "Plan weekend trip"