const Colors = {
    dark: {
        // "Midnight Luxury" Theme - Eyecatching, Deep Blue, Premium

        // Backgrounds: Deep Slate/Blue instead of boring black
        background: '#0F172A', // Slate 900
        backgroundSecondary: '#1E293B', // Slate 800

        // Surfaces: Glassy & Visible
        surface: '#1E293B', // Lighter slate
        surfaceHighlight: '#334155', // Slate 700
        cardBackground: '#1E293B',

        // Typography: Crisp White
        text: '#FFFFFF',
        textSecondary: '#94A3B8', // Slate 400
        textTertiary: '#64748B', // Slate 500
        white: '#FFFFFF',

        // Accents: Vibrant & Electric
        primary: '#38BDF8', // Sky Blue - Pops against dark blue
        accent: '#FACC15', // Yellow Gold - High contrast

        // Semantic Colors
        gold: '#FACC15',
        copper: '#FB923C', // Orange
        teal: '#2DD4BF', // Teal
        purple: '#C084FC', // Violet
        danger: '#F87171', // Red
        success: '#4ADE80', // Green

        primaryDark: '#0EA5E9',
        secondary: '#334155',

        // Lighting & Borders
        borderTop: 'rgba(255,255,255,0.2)', // Sharper highlight
        borderBot: 'rgba(0,0,0,0.6)',
        border: 'rgba(255,255,255,0.1)',

        // Glass System
        glass: {
            heavy: 'rgba(15, 23, 42, 0.9)',
            medium: 'rgba(30, 41, 59, 0.7)',
            light: 'rgba(255, 255, 255, 0.1)',
            border: 'rgba(255, 255, 255, 0.15)',
        },

        // Gradients: Eyecatching & Deep
        gradients: {
            // Main Background: Rich Midnight Gradient
            // Main Background: Rich Midnight Gradient (Mesh-like depth)
            AppBackground: ['#0F172A', '#1E1B4B', '#020617'] as const, // Slate 900 -> Midnight Violet -> Black

            // Bento Cards: Subtle Blue/Grey Gradient to pop against bg
            BentoBase: ['rgba(51, 65, 85, 0.6)', 'rgba(30, 41, 59, 0.4)'],
            BentoHighlight: ['rgba(56, 189, 248, 0.2)', 'rgba(56, 189, 248, 0.05)'], // Blue Glow

            // Progress Ring
            Progress: ['#FACC15', '#FDE047', '#EAB308'], // Gold Gradient
            ProgressTrack: '#334155',

            // Functional
            Urgent: ['rgba(248, 113, 113, 0.2)', 'rgba(248, 113, 113, 0.05)'],

            // Category Gradients (Midnight/Neon)
            Finance: ['#0EA5E9', '#0284C7'] as const, // Sky Blue
            Academic: ['#8B5CF6', '#7C3AED'] as const, // Violet
            Housing: ['#10B981', '#059669'] as const, // Emerald
            Work: ['#64748B', '#475569'] as const, // Slate
            Utility: ['#F59E0B', '#D97706'] as const, // Amber
            Medicine: ['#F43F5E', '#E11D48'] as const, // Rose
            Gym: ['#84CC16', '#65A30D'] as const, // Lime

            // Legacy/Compat
            Bento1: ['rgba(51, 65, 85, 0.6)', 'rgba(30, 41, 59, 0.4)'],
        }
    },
    // Legacy Mappings
    gradientPrimary: ['#FACC15', '#EAB308'] as const,
};

export default Colors;
