import React from 'react';

interface PromptSuggestonButtonProps {
    text: string;
    onClick: () => void;
}

const PromptSuggestonButton: React.FC<PromptSuggestonButtonProps> = ({ text, onClick }) => {
    return (
        <button
            className="prompt-suggest-button"
            onClick={onClick} // Fixed onclick to onClick
            type="button"
        >
            {text}
        </button>
    );
};

export default PromptSuggestonButton;