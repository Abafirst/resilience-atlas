// scoring.js

/**
 * Function to calculate score based on quiz results
 * @param {number[]} answers - Array of user's answers
 * @param {number[]} correctAnswers - Array of correct answers
 * @returns {Object} - Contains score and feedback
 */
function calculateScore(answers, correctAnswers) {
    let score = 0;
    for(let i = 0; i < answers.length; i++) {
        if(answers[i] === correctAnswers[i]) {
            score++;
        }
    }
    const percentage = (score / correctAnswers.length) * 100;
    let feedback = '';

    // Determine feedback based on score
    if(percentage === 100) {
        feedback = 'Excellent! Perfect score!';
    } else if(percentage >= 75) {
        feedback = 'Great job! You have a good understanding of the material.';
    } else if(percentage >= 50) {
        feedback = 'Not bad! Consider reviewing the material.';
    } else {
        feedback = 'Keep trying! Review the content and take the quiz again.';
    }

    return { score, feedback };
}

module.exports = { calculateScore };