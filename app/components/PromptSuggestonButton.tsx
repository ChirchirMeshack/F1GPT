import {text} from "node:stream/consumers";

const PromptSuggestonButton = ({text,onClick}) => {
    return (
        <button className="prompt-suggest-button"
        onClick={onclick}>
            {text}

        </button>
    )
}
export default PromptSuggestonButton