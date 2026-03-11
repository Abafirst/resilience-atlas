function calculateResilienceScores(answers, questions) {

  const dimensions = {
    "Somatic-Behavioral": 0,
    "Cognitive-Narrative": 0,
    "Emotional-Adaptive": 0,
    "Relational": 0,
    "Agentic-Generative": 0,
    "Spiritual-Existential": 0
  };

  const counts = {
    "Somatic-Behavioral": 0,
    "Cognitive-Narrative": 0,
    "Emotional-Adaptive": 0,
    "Relational": 0,
    "Agentic-Generative": 0,
    "Spiritual-Existential": 0
  };

  answers.forEach((value, index) => {

    const question = questions[index];
    const dimension = question.category;

    if (dimension && value !== null) {
      dimensions[dimension] += value;
      counts[dimension]++;
    }

  });

  // convert to percentages
  const scores = {};

  Object.keys(dimensions).forEach(dim => {
    if (counts[dim] > 0) {
      scores[dim] = Math.round((dimensions[dim] / (counts[dim] * 5)) * 100);
    } else {
      scores[dim] = 0;
    }
  });

  return scores;

}

module.exports = { calculateResilienceScores };
