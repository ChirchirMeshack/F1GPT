import "./global.css"
import { title } from "process";
export const metadata = {
    title: "F1GPT",  // Corrected syntax here
    description: "The place to go for all your Formula One Questions"
};

const RootLayout = ({children}) => {
    return(
        <html lang="en">
        <body>
        {children}
        </body>
        </html>
    )
}

export default RootLayout