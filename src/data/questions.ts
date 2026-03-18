import { getUniqueFactForIndex, Language } from './fact-pool';

export { type Language };

export interface Question {
  id: string;
  category: string;
  difficulty: number;
  question: { en: string; bn: string };
  options: { en: string[]; bn: string[] };
  correctIndex: number;
}

// Seeded random number generator for deterministic options placement
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const getQuestionsForLevel = (level: number): Question[] => {
  const questions: Question[] = [];
  
  // Every level takes exactly 10 unique indices from the global pool
  // Level 1: 0-9
  // Level 2: 10-19
  // ...
  // Level 1000: 9990-9999
  const baseIndex = (level - 1) * 10;
  
  for (let i = 0; i < 10; i++) {
    const globalIndex = baseIndex + i;
    const fact = getUniqueFactForIndex(globalIndex);
    
    // Deterministic random index for correct answer based on globalIndex
    const correctIndex = Math.floor(seededRandom(globalIndex) * 4);
    
    const optionsEn = [...fact.o.en];
    const optionsBn = [...fact.o.bn];
    
    optionsEn.splice(correctIndex, 0, fact.a.en);
    optionsBn.splice(correctIndex, 0, fact.a.bn);

    questions.push({
      id: `q-${globalIndex}`,
      category: fact.category,
      difficulty: level,
      question: fact.q,
      options: {
        en: optionsEn.slice(0, 4),
        bn: optionsBn.slice(0, 4)
      },
      correctIndex
    });
  }

  return questions;
};
