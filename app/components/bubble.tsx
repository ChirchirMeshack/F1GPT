import { Message } from 'ai';
import React from 'react';

interface BubbleProps {
    message: Message;
}

const Bubble: React.FC<BubbleProps> = ({ message }) => {
    const { content, role } = message;

    return (
        <div className={`${role} bubble`}>
            {content}
        </div>
    );
};

export default Bubble;