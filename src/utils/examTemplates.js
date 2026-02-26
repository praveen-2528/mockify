export const EXAM_TEMPLATES = {
    ssc_cgl_tier1: {
        id: 'ssc_cgl_tier1',
        name: 'SSC CGL Tier-1',
        optionsPerQuestion: 4,
        durationSeconds: 3600, // 60 mins
        markingScheme: { correct: 2, incorrect: -0.5, unattempted: 0 },
        subjects: [
            { id: 'reasoning', name: 'General Intelligence & Reasoning', count: 25 },
            { id: 'awareness', name: 'General Awareness', count: 25 },
            { id: 'quant', name: 'Quantitative Aptitude', count: 25 },
            { id: 'english', name: 'English Comprehension', count: 25 },
        ]
    },
    ibps_po_pre: {
        id: 'ibps_po_pre',
        name: 'IBPS PO Prelims',
        optionsPerQuestion: 5,
        durationSeconds: 3600, // 60 mins
        markingScheme: { correct: 1, incorrect: -0.25, unattempted: 0 },
        subjects: [
            { id: 'english', name: 'English Language', count: 30 },
            { id: 'quant', name: 'Quantitative Aptitude', count: 35 },
            { id: 'reasoning', name: 'Reasoning Ability', count: 35 },
        ]
    },
    rrb_ntpc_cbt1: {
        id: 'rrb_ntpc_cbt1',
        name: 'RRB NTPC CBT-1',
        optionsPerQuestion: 4,
        durationSeconds: 5400, // 90 mins
        markingScheme: { correct: 1, incorrect: -0.33, unattempted: 0 },
        subjects: [
            { id: 'awareness', name: 'General Awareness', count: 40 },
            { id: 'math', name: 'Mathematics', count: 30 },
            { id: 'reasoning', name: 'General Intelligence & Reasoning', count: 30 },
        ]
    }
};
