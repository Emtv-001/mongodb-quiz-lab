import { EvaluationResult, PartialCreditBreakdown, Question } from '../types';

/**
 * Normalizes MongoDB shell commands by standardizing whitespace, quotes, and punctuation spacing.
 */
export function normalizeMongoCommand(cmd: string): string {
  if (!cmd) return '';
  return cmd
    .trim()
    .replace(/\r?\n|\r/g, ' ')           // flatten newlines
    .replace(/\s+/g, ' ')                // collapse whitespace
    .replace(/'/g, '"')                  // convert single quotes to double quotes
    .replace(/\s*([\{\}\[\]\(\):,])\s*/g, '$1') // remove spacing around punctuation
    .replace(/"([a-zA-Z0-9_$]+)"\s*:/g, '$1:')  // unquote object keys for uniform comparison
    .replace(/;$/, '');                  // remove trailing semicolon
}

/**
 * Evaluates student's code command with intelligent partial credit scoring.
 */
export function evaluateCodeCommand(
  studentInput: string,
  question: Question
): EvaluationResult {
  const maxScore = question.points || 10;
  const rawInput = (studentInput || '').trim();
  const normalizedStudent = normalizeMongoCommand(rawInput);
  const normalizedExpected = normalizeMongoCommand(question.expectedCommand || '');
  const normalizedAlternatives = (question.acceptableAlternatives || []).map(normalizeMongoCommand);

  // 1. Direct match with expected or alternatives
  if (normalizedStudent === normalizedExpected || normalizedAlternatives.includes(normalizedStudent)) {
    return {
      isCorrect: true,
      isPartial: false,
      score: maxScore,
      maxScore,
      studentAnswer: rawInput,
      correctAnswer: question.expectedCommand,
      feedback: "Excellent! Your MongoDB command matches the exact syntax and requirements.",
      concept: question.conceptFocus,
      breakdown: {
        awardedPoints: maxScore,
        maxPoints: maxScore,
        matchedCriteria: ["Correct collection & method", "Accurate query filter", "Correct operator(s)", "Correct fields & values"],
        missedCriteria: [],
        feedbackNotes: "Full marks awarded for flawless execution."
      },
      correctedCommand: question.expectedCommand
    };
  }

  // If student wrote nothing
  if (!rawInput) {
    return {
      isCorrect: false,
      isPartial: false,
      score: 0,
      maxScore,
      studentAnswer: "(No command provided)",
      correctAnswer: question.expectedCommand,
      feedback: "No command was submitted.",
      concept: question.conceptFocus,
      misconception: question.misconception,
      breakdown: {
        awardedPoints: 0,
        maxPoints: maxScore,
        matchedCriteria: [],
        missedCriteria: ["Command missing"],
        feedbackNotes: "Please write a MongoDB query or update command."
      },
      correctedCommand: question.expectedCommand
    };
  }

  // 2. Component-by-Component Partial Credit Analysis
  let awarded = 0;
  const matchedCriteria: string[] = [];
  const missedCriteria: string[] = [];
  const feedbackItems: string[] = [];

  // A. Collection & Method Check (e.g. db.GptData02.updateOne or db.accounts.find) - 2.0 pts
  const methodMatch = question.expectedCommand?.match(/db\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9]+)/);
  if (methodMatch) {
    const expectedCol = methodMatch[1];
    const expectedMethod = methodMatch[2];
    const hasCol = rawInput.toLowerCase().includes(expectedCol.toLowerCase());
    const hasMethod = rawInput.toLowerCase().includes(expectedMethod.toLowerCase());

    if (hasCol && hasMethod) {
      awarded += 2.0;
      matchedCriteria.push(`Correct collection (db.${expectedCol}) and method (.${expectedMethod})`);
    } else if (hasMethod) {
      awarded += 1.2;
      matchedCriteria.push(`Correct method (.${expectedMethod})`);
      missedCriteria.push(`Expected collection db.${expectedCol}`);
      feedbackItems.push(`You used .${expectedMethod}(), but make sure to target db.${expectedCol}.`);
    } else {
      missedCriteria.push(`Correct collection & method invocation`);
      feedbackItems.push(`Command should begin with db.${expectedCol}.${expectedMethod}(...).`);
    }
  }

  // B. Query Filter Check - 2.5 pts
  const filterMatch = question.expectedCommand?.match(/\(\s*(\{.*?\})\s*,/s);
  if (filterMatch) {
    const expectedFilterClean = normalizeMongoCommand(filterMatch[1]);
    const studentFilterMatch = rawInput.match(/\(\s*(\{.*?\})\s*,/s);
    const studentFilterClean = studentFilterMatch ? normalizeMongoCommand(studentFilterMatch[1]) : '';

    if (studentFilterClean === expectedFilterClean || (studentFilterClean && normalizedStudent.includes(expectedFilterClean))) {
      awarded += 2.5;
      matchedCriteria.push("Accurate query filter document");
    } else if (studentFilterClean && (studentFilterClean.includes('_id') || studentFilterClean.includes('accountNumber') || studentFilterClean.includes('status'))) {
      awarded += 1.5;
      matchedCriteria.push("Query filter partially matched target document");
      feedbackItems.push("The filter document had slight discrepancies from the required criteria.");
    } else {
      missedCriteria.push("Query filter document missing or incorrect");
      feedbackItems.push("Check the query filter argument in the first parameter.");
    }
  }

  // C. MongoDB Operators Check ($push, $each, $inc, $group, $match, etc.) - 3.5 pts
  const operatorsInExpected = (question.expectedCommand?.match(/\$[a-zA-Z0-9]+/g) || []);
  const uniqueExpectedOps = Array.from(new Set(operatorsInExpected));

  let opsMatched = 0;
  const missingOps: string[] = [];
  uniqueExpectedOps.forEach(op => {
    if (rawInput.includes(op)) {
      opsMatched++;
    } else {
      missingOps.push(op);
    }
  });

  if (uniqueExpectedOps.length > 0) {
    const opRatio = opsMatched / uniqueExpectedOps.length;
    const opPoints = 3.5 * opRatio;
    awarded += opPoints;

    if (opRatio === 1) {
      matchedCriteria.push(`Correct MongoDB operator(s): ${uniqueExpectedOps.join(', ')}`);
    } else if (opsMatched > 0) {
      matchedCriteria.push(`Partial operators used (${opsMatched}/${uniqueExpectedOps.length})`);
      missedCriteria.push(`Missing operator(s): ${missingOps.join(', ')}`);
      feedbackItems.push(`Required operator(s) missing: ${missingOps.join(', ')}.`);
    } else {
      missedCriteria.push(`Did not use required operator(s): ${uniqueExpectedOps.join(', ')}`);
      feedbackItems.push(`The question requires operator(s): ${uniqueExpectedOps.join(', ')}.`);
    }
  }

  // D. Field Names & Typos Check - 2.0 pts
  const fieldNamesRegex = /["']?([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)["']?\s*:/g;
  const expectedFields: string[] = [];
  let m;
  while ((m = fieldNamesRegex.exec(question.expectedCommand || '')) !== null) {
    if (!m[1].startsWith('$') && !['db', '_id'].includes(m[1])) {
      expectedFields.push(m[1]);
    }
  }

  let fieldsMatched = 0;
  expectedFields.forEach(expectedField => {
    if (rawInput.includes(expectedField)) {
      fieldsMatched++;
    } else {
      const dotParts = expectedField.split('.');
      const leafName = dotParts[dotParts.length - 1];
      if (
        (leafName.toLowerCase() === 'housenumber' && /houseno\b/i.test(rawInput)) ||
        (leafName.toLowerCase() === 'balance' && /bal\b/i.test(rawInput)) ||
        (leafName.toLowerCase() === 'courses' && /\bcourse\b/i.test(rawInput))
      ) {
        awarded += 1.0;
        feedbackItems.push(`Your answer used an abbreviated field name instead of "${expectedField}". Partial credit awarded.`);
      } else {
        missedCriteria.push(`Expected field "${expectedField}"`);
      }
    }
  });

  if (expectedFields.length > 0 && fieldsMatched === expectedFields.length) {
    awarded += 2.0;
    matchedCriteria.push(`All target field names matched correctly`);
  }

  // Cap awarded score
  let finalScore = Math.min(maxScore, Math.max(0, Math.round(awarded * 10) / 10));
  const isCorrect = finalScore >= (maxScore * 0.95);
  if (isCorrect) finalScore = maxScore;

  const detailedFeedback = feedbackItems.length > 0
    ? feedbackItems.join(' ')
    : "Review the exact operator syntax, modifiers, and field names.";

  return {
    isCorrect,
    isPartial: !isCorrect && finalScore > 0,
    score: finalScore,
    maxScore,
    studentAnswer: rawInput,
    correctAnswer: question.expectedCommand,
    feedback: detailedFeedback,
    concept: question.conceptFocus,
    misconception: question.misconception,
    breakdown: {
      awardedPoints: finalScore,
      maxPoints: maxScore,
      matchedCriteria,
      missedCriteria,
      feedbackNotes: detailedFeedback
    },
    correctedCommand: question.expectedCommand
  };
}

/**
 * Universal evaluator handling all 10 question types
 */
export function evaluateAnswer(
  question: Question,
  studentAnswer: any
): EvaluationResult {
  const maxScore = question.points || 10;

  switch (question.type) {
    case 'write-command':
    case 'fix-query':
      return evaluateCodeCommand(studentAnswer as string, question);

    case 'multiple-select': {
      // studentAnswer is number[]
      const selected = (studentAnswer as number[]) || [];
      const expected = question.correctOptionIndices || [];

      const correctSelected = selected.filter(i => expected.includes(i)).length;
      const incorrectSelected = selected.filter(i => !expected.includes(i)).length;

      const isExact = expected.length > 0 &&
        correctSelected === expected.length &&
        incorrectSelected === 0;

      const earned = isExact
        ? maxScore
        : Math.max(0, Math.round(((correctSelected - (incorrectSelected * 0.5)) / expected.length) * maxScore * 10) / 10);

      const isPart = earned > 0 && !isExact;

      return {
        isCorrect: isExact,
        isPartial: isPart,
        score: earned,
        maxScore,
        studentAnswer: selected.map(i => question.options?.[i] || `${i}`),
        correctAnswer: expected.map(i => question.options?.[i] || `${i}`),
        feedback: isExact
          ? "All correct options selected!"
          : `Selected ${correctSelected} of ${expected.length} correct options. ${incorrectSelected > 0 ? `${incorrectSelected} incorrect options selected.` : ''}`,
        concept: question.conceptFocus,
        misconception: question.misconception,
        breakdown: {
          awardedPoints: earned,
          maxPoints: maxScore,
          matchedCriteria: isExact ? ["All correct choices identified"] : [`${correctSelected}/${expected.length} matched`],
          missedCriteria: isExact ? [] : ["Incomplete or extra choices"],
          feedbackNotes: question.explanation
        }
      };
    }

    case 'multiple-choice':
    case 'predict-output':
    case 'find-error':
    case 'scenario':
    case 'true-false': {
      const selectedIndex = Number(studentAnswer);
      const isCorrect = selectedIndex === question.correctOptionIndex;
      const score = isCorrect ? maxScore : 0;
      const correctOptionText = question.options && question.correctOptionIndex !== undefined
        ? question.options[question.correctOptionIndex]
        : '';
      const studentOptionText = question.options && selectedIndex !== undefined && selectedIndex >= 0
        ? question.options[selectedIndex]
        : '(None selected)';

      return {
        isCorrect,
        isPartial: false,
        score,
        maxScore,
        studentAnswer: studentOptionText,
        correctAnswer: correctOptionText,
        feedback: isCorrect
          ? "Correct! You identified the right MongoDB behavior."
          : `Incorrect. The correct choice was: "${correctOptionText}".`,
        concept: question.conceptFocus,
        misconception: question.misconception,
        breakdown: {
          awardedPoints: score,
          maxPoints: maxScore,
          matchedCriteria: isCorrect ? ["Selected correct answer"] : [],
          missedCriteria: isCorrect ? [] : ["Did not select correct choice"],
          feedbackNotes: question.explanation
        }
      };
    }

    case 'match-operator': {
      const matches = (studentAnswer as Record<string, string>) || {};
      const pairs = question.matchPairs || [];
      if (pairs.length === 0) return { isCorrect: true, isPartial: false, score: maxScore, maxScore, studentAnswer, correctAnswer: null, feedback: "Valid", concept: question.conceptFocus };

      let correctCount = 0;
      const matched: string[] = [];
      const missed: string[] = [];

      pairs.forEach(pair => {
        if (matches[pair.id] === pair.id) {
          correctCount++;
          matched.push(pair.operator);
        } else {
          missed.push(pair.operator);
        }
      });

      const scorePerPair = maxScore / pairs.length;
      const earned = Math.round((correctCount * scorePerPair) * 10) / 10;
      const isFull = correctCount === pairs.length;
      const isPart = correctCount > 0 && !isFull;

      return {
        isCorrect: isFull,
        isPartial: isPart,
        score: earned,
        maxScore,
        studentAnswer: matches,
        correctAnswer: pairs.map(p => `${p.operator} ➔ ${p.definition}`).join(' | '),
        feedback: isFull
          ? "All operators matched correctly!"
          : `You matched ${correctCount} of ${pairs.length} operators correctly. ${missed.length > 0 ? `Review: ${missed.join(', ')}.` : ''}`,
        concept: question.conceptFocus,
        misconception: question.misconception,
        breakdown: {
          awardedPoints: earned,
          maxPoints: maxScore,
          matchedCriteria: matched.map(m => `Matched ${m}`),
          missedCriteria: missed.map(m => `Incorrect match for ${m}`),
          feedbackNotes: question.explanation
        }
      };
    }

    case 'arrange-command': {
      const studentOrder = (studentAnswer as string[]) || [];
      const expectedOrder = question.correctArrangeOrder || [];
      const isExact = JSON.stringify(studentOrder) === JSON.stringify(expectedOrder);

      if (isExact) {
        return {
          isCorrect: true,
          isPartial: false,
          score: maxScore,
          maxScore,
          studentAnswer: studentOrder,
          correctAnswer: expectedOrder,
          feedback: "Command arranged in the exact MongoDB order!",
          concept: question.conceptFocus,
          breakdown: {
            awardedPoints: maxScore,
            maxPoints: maxScore,
            matchedCriteria: ["All blocks in proper sequence"],
            missedCriteria: [],
            feedbackNotes: "Full points awarded."
          }
        };
      }

      let sequentialMatches = 0;
      for (let i = 0; i < expectedOrder.length; i++) {
        if (studentOrder[i] === expectedOrder[i]) {
          sequentialMatches++;
        }
      }

      const partialScore = Math.round(((sequentialMatches / expectedOrder.length) * maxScore) * 10) / 10;
      return {
        isCorrect: false,
        isPartial: partialScore > 0,
        score: partialScore,
        maxScore,
        studentAnswer: studentOrder,
        correctAnswer: expectedOrder,
        feedback: partialScore > 0
          ? `Partially correct order (${sequentialMatches}/${expectedOrder.length} blocks placed correctly).`
          : "The command sequence was incorrect. Review the required modifier order.",
        concept: question.conceptFocus,
        misconception: question.misconception,
        breakdown: {
          awardedPoints: partialScore,
          maxPoints: maxScore,
          matchedCriteria: [`${sequentialMatches} blocks in correct slot`],
          missedCriteria: ["Block order mismatch"],
          feedbackNotes: question.explanation
        }
      };
    }

    default:
      return {
        isCorrect: false,
        isPartial: false,
        score: 0,
        maxScore,
        studentAnswer,
        correctAnswer: null,
        feedback: "Unknown question type.",
        concept: question.conceptFocus
      };
  }
}
