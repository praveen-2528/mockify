import React, { createContext, useContext, useState } from 'react';

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
    const [examState, setExamState] = useState({
        examType: null, // 'ssc' or 'ibps'
        testFormat: null, // 'full', 'subject', 'topic'
        questions: [],
        testStarted: false,
        currentQuestionIndex: 0,
        answers: {}, // { questionId: selectedOptionIndex }
        markedForReview: [], // array of question indices marked for review
        timeSpent: [], // array where index is questionIndex and value is seconds spent
    });

    const updateExamState = (updates) => {
        setExamState((prev) => ({ ...prev, ...updates }));
    };

    const resetExam = () => {
        setExamState({
            examType: null,
            testFormat: null,
            questions: [],
            testStarted: false,
            currentQuestionIndex: 0,
            answers: {},
            markedForReview: [],
            timeSpent: [],
        });
    };

    return (
        <ExamContext.Provider value={{ ...examState, updateExamState, resetExam }}>
            {children}
        </ExamContext.Provider>
    );
};
