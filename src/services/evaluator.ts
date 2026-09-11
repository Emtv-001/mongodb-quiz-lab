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
 * Calculates Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion, deletion
        );
      }
    }
  }
  return matrix[bn][an];
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

  // A. Collection & Method Check (e.g. db.GptData02.updateOne) - 2.0 pts
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

  // B. Query Filter Check (e.g. {_id: 1} or {_id: 10}) - 2.5 pts
  const filterMatch = question.expectedCommand?.match(/\(\s*(\{.*?\})\s*,/s);
  if (filterMatch) {
    const expectedFilterClean = normalizeMongoCommand(filterMatch[1]);
    const studentFilterMatch = rawInput.match(/\(\s*(\{.*?\})\s*,/s);
    const studentFilterClean = studentFilterMatch ? normalizeMongoCommand(studentFilterMatch[1]) : '';

    if (studentFilterClean === expectedFilterClean || (studentFilterClean && normalizedStudent.includes(expectedFilterClean))) {
      awarded += 2.5;
      matchedCriteria.push("Accurate query filter document");
    } else if (studentFilterClean && (studentFilterClean.includes('_id') || studentFilterClean.includes('Courses'))) {
      awarded += 1.5;
      matchedCriteria.push("Query filter partially matched target document");
      feedbackItems.push("The filter document had slight discrepancies from the required criteria.");
    } else {
      missedCriteria.push("Query filter document missing or incorrect");
      feedbackItems.push("Check the query filter argument in the first parameter.");
    }
  }

  // C. MongoDB Operators Check (e.g. $push, $each, $position, $slice, $sort, $min, $max, $set, $unset, $rename, $inc, $pull, $pullAll, $pop, $addToSet, $setOnInsert) - 3.5 pts
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

  // D. Field Names & Typos Check (e.g. Address.HouseNo vs Address.HouseNumber) - 2.0 pts
  // Detect known target fields from expected command
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
      // Check for common abbreviation/typo like HouseNo instead of HouseNumber
      const dotParts = expectedField.split('.');
      const leafName = dotParts[dotParts.length - 1];
      if (
        (leafName.toLowerCase() === 'housenumber' && /houseno\b/i.test(rawInput)) ||
        (leafName.toLowerCase() === 'state' && /province\b/i.test(rawInput)) ||
        (leafName.toLowerCase() === 'active' && /status\b/i.test(rawInput)) ||
        (leafName.toLowerCase() === 'courses' && /\bcourse\b/i.test(rawInput))
      ) {
        awarded += 1.0;
        feedbackItems.push(`Your answer used an abbreviated or alternate field name instead of "${expectedField}". Your operator logic was recognized, so partial credit was awarded.`);
      } else {
        missedCriteria.push(`Expected field "${expectedField}"`);
      }
    }
  });

  if (expectedFields.length > 0 && fieldsMatched === expectedFields.length) {
    awarded += 2.0;
    matchedCriteria.push(`All target field names matched correctly`);
  }

  // E. Upsert option check if required
  if (question.expectedCommand?.includes('upsert')) {
    if (rawInput.includes('upsert') && /upsert\s*:\s*true/i.test(rawInput)) {
      matchedCriteria.push("Included {upsert: true} option");
    } else {
      missedCriteria.push("Missing {upsert: true} option in update arguments");
      feedbackItems.push("Remember to include { upsert: true } as the third argument.");
    }
  }

  // Cap awarded score between 0 and maxScore
  let finalScore = Math.min(maxScore, Math.max(0, Math.round(awarded * 10) / 10));
  // If close to full score but slightly different formatting, give at least 9 or 8
  const isPartial = finalScore > 0 && finalScore < maxScore;
  const isCorrect = finalScore >= (maxScore * 0.95);

  if (isCorrect) {
    finalScore = maxScore;
  }

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
 * Universal evaluator handling all question types
 */
export function evaluateAnswer(
  question: Question,
  studentAnswer: any
): EvaluationResult {
  const maxScore = question.points || 10;

  switch (question.type) {
    case 'write-command':
      return evaluateCodeCommand(studentAnswer as string, question);

    case 'multiple-choice':
    case 'predict-output':
    case 'find-error':
    case 'scenario': {
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
      // studentAnswer is Record<string, string> where key = operatorId, value = definitionId
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
      // studentAnswer is array of block IDs: string[]
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

      // Check partial sequential matches
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
          ? `Partially correct order (${sequentialMatches}/${expectedOrder.length} blocks placed correctly). Notice the order of modifiers like $each before $position or $sort.`
          : "The command sequence was incorrect. Review the required modifier order.",
        concept: question.conceptFocus,
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
