
"use client";

import { useReducer } from "react";
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type State = {
  messages: Message[];
  input: string;
  isLoading: boolean;
  txt: string;
};

type Action =
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: string }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_TXT"; payload: string }
  | { type: "RESET_TXT" };

const initialState: State = {
  messages: [],
  input: "",
  isLoading: false,
  txt: "",
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, { role: "user", content: action.payload }],
      };
    case "ADD_ASSISTANT_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, { role: "assistant", content: action.payload }],
      };
    case "SET_INPUT":
      return {
        ...state,
        input: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "UPDATE_TXT":
      return {
        ...state,
        txt: state.txt + action.payload,
        messages: state.messages.map((msg, index) =>
          index === state.messages.length - 1 && msg.role === "assistant"
            ? { ...msg, content: state.txt + action.payload }
            : msg
        ),
      };
    case "RESET_TXT":
      return {
        ...state,
        txt: "",
      };
    default:
      return state;
  }
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_INPUT", payload: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "ADD_USER_MESSAGE", payload: state.input });

    try {
      const res = await fetch("/api/chat-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...state.messages, { role: "user", content: state.input }] }),
      });

      const data = await res.json();
      const assistantMessageContent = data.data;

      dispatch({ type: "RESET_TXT" });
      dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: "" });

      let len = assistantMessageContent.length;
      let index = 0;

      const intervalId = setInterval(() => {
        if (index < len) {
          dispatch({ type: "UPDATE_TXT", payload: assistantMessageContent[index] });
          index++;
        } else {
          clearInterval(intervalId);
        }
      }, 20);

    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
      dispatch({ type: "SET_INPUT", payload: "" });
    }
  };

  return (
    <main>
      {/* <Image
        src="/images/bg_img.jpg"
        layout="fill"
        alt="img"
        objectFit="cover"
      /> */}
      <div className="absolute md:px-4 w-full h-screen flex flex-col gap-5 items-center bottom-5 bg-slate-900">
        <h1 className="text-xl md:text-5xl px-2 font-bold text-white font-serif mt-10">
          Aswin K O&rsquo;s Portfolio
        </h1>
        <section className="w-full flex-1 flex-col overflow-y-scroll overflow-x-hidden md:px-64 rounded-sm">
          {state.messages.length === 0 ? (
            <p className="text-center text-xl">Ask me anything?</p>
          ) : (
            <>
              {state.messages.map((msg, index) => (
                <div
                  key={`message-${index}`}
                  className={`rounded-3xl ${
                    msg.role === "user"
                      ? "rounded-br-none bg-gray-600 ml-auto md:w-[60%]"
                      : "rounded-bl-none bg-teal-900 md:w-full"
                  } m-2 p-2 px-4 w-[70%]  mt-4 text-gray-200`}
                >
                  <strong
                    className={`${
                      msg.role === "user" ? "text-white" : "text-red-500"
                    }`}
                  >
                    {msg.role === "user" ? `You: ` : "Aswin: "}
                  </strong>
                  <span className="text-xs md:text-base">
                    {msg.content}
                  </span>
                </div>
              ))}
              {state.isLoading && <span className="ml-auto">Thinking...🤓</span>}
            </>
          )}
        </section>

        <form
          action=""
          className="md:w-full flex gap-1"
          onSubmit={handleSubmit}
        >
          <input
            onChange={handleInputChange}
            value={state.input}
            className="p-2 md:py-3 md:px-5 flex-1 rounded-full text-black md:text-xl border-2 border-gray-50 focus:outline-none focus:border-blue-500"
            type="text"
            placeholder="write your name ?"
          />
          <button
            type="submit"
            disabled={state.isLoading}
            className="bg-blue-800 hover:bg-blue-600 text-white rounded-full text-xs px-3 md:text-lg md:px-5 cursor-pointer focus:outline-none disabled:bg-blue-400"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}











// "use client";

// import { useChat } from "ai/react";
// import Image from "next/image";
// import { useState } from "react";

// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };

// export default function Home() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [txt, setTxt] = useState<any>("");

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInput(e.target.value);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     setIsLoading(true);

//     const newMessages: Message[] = [
//       ...messages,
//       { role: "user", content: input },
//     ];
//     setMessages(newMessages);

//     try {
//       const res = await fetch("/api/chat-test", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ messages: newMessages }),
//       });

//       const data = await res.json();
//       const assistantMessage: Message = {
//         role: "assistant",
//         content: data.data,
//       };

//       // setMessages([...newMessages, assistantMessage]);

//        // Reset txt before starting the new message
//        setTxt("");

//       let len = assistantMessage.content.length;
//       let text = assistantMessage.content;
//       console.log(text);

//       let index = 0;

//       const intervalId = setInterval(() => {
//         if (index <= len) {
//             setTxt((prevTxt) => prevTxt + (text[index] !== undefined ? text[index] : '') );
//           index++;
//         } else {
//           clearInterval(intervalId);
//           // After the typing effect is done, update the messages state
//           setMessages((prevMessages) => [...prevMessages, assistantMessage]);
//         }
//       }, 100);

//     } catch (error) {
//       console.error("Error submitting form:", error);
//     } finally {
//       setIsLoading(false);
//       setInput("");
//     }
//   };

//   console.log(txt);

//   return (
//     <main>
//       <Image
//         src="/images/bg_img.jpg"
//         layout="fill"
//         alt="img"
//         objectFit="cover"
//       />
//       <div className="absolute md:px-4 w-full h-screen flex flex-col gap-5 items-center bottom-5">
//         <h1 className="text-xl md:text-5xl px-2 font-bold text-white font-serif mt-10">
//           Aswin K O&rsquo;s Portfolio
//         </h1>
//         <section className="w-full flex-1 flex-col overflow-y-scroll">
//           {messages?.length === 0 ? (
//             <p className="text-center text-xl">Ask me anything?</p>
//           ) : (
//             <>
//               {messages?.map((msg, index) => (
//                 <div
//                   key={`message-${index}`}
//                   className={`rounded-3xl ${
//                     msg.role === "user"
//                       ? "rounded-br-none bg-gray-600 ml-auto"
//                       : "rounded-bl-none bg-teal-900"
//                   } m-2 p-2 px-4 w-[70%] md:w-[80%] mt-4 text-gray-200`}
//                 >
//                   <strong
//                     className={`${
//                       msg.role === "user" ? "text-white" : "text-red-500"
//                     }`}
//                   >
//                     {msg.role === "user" ? `You: ` : "Aswin: "}
//                   </strong>
//                   <span className="text-xs md:text-base">
//                     {" "}
//                     {/* {msg.role === "assistant" && txt} */}
//                     {msg.role === "assistant" && msg.content === txt ? txt : msg.content}

//                   </span>
//                 </div>
//               ))}
//               {isLoading && <span className="ml-auto">Thinking...🤓</span>}
//             </>
//           )}
//         </section>

//         <form
//           action=""
//           className="md:w-full flex gap-1"
//           onSubmit={handleSubmit}
//           // onSubmit={(e) => {
//           //   e.preventDefault();
//           //   handleSubmit(e);
//           // }}
//         >
//           <input
//             onChange={handleInputChange}
//             value={input}
//             className="p-2 md:py-3 md:px-5 flex-1 rounded-full text-black md:text-xl border-2 border-gray-50 focus:outline-none focus:border-blue-500"
//             type="text"
//             placeholder="write your name ?"
//           />
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs px-3 md:text-lg md:px-5 cursor-pointer focus:outline-none disabled:bg-blue-400"
//           >
//             Submit
//           </button>
//         </form>
//       </div>
//     </main>
//   );
// }