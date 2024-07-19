"use client";

import { useChat } from "ai/react";
import Image from "next/image";
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);

    try {
      const res = await fetch("/api/chat-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.data,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  return (
    <main>
      <Image src="/images/bg_img.jpg" layout="fill" alt="img" objectFit="cover" />
      <div className="absolute md:px-4 w-full h-screen flex flex-col gap-5 items-center bottom-5">
        <h1 className="text-xl md:text-5xl px-2 font-bold text-white font-serif mt-10">
          Aswin K O&rsquo;s Portfolio
        </h1>
        <section className="w-full flex-1 flex-col overflow-y-scroll">
          {messages.length === 0 ? (
            <p className="text-center text-xl">Ask me anything?</p>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={`message-${index}`}
                  className={`rounded-3xl ${
                    msg.role === "user"
                      ? "rounded-br-none bg-gray-600 ml-auto"
                      : "rounded-bl-none bg-teal-900"
                  } m-2 p-2 px-4 w-[70%] md:w-[80%] mt-4 text-gray-200`}
                >
                  <strong
                    className={`${
                      msg.role === "user" ? "text-white" : "text-red-500"
                    }`}
                  >
                    {msg.role === "user" ? "You: " : "Aswin: "}
                  </strong>
                  <span className="text-xs md:text-base">{msg.content}</span>
                </div>
              ))}
              {isLoading && <span className="ml-auto">Thinking...🤓</span>}
            </>
          )}
        </section>

        <form
          action=""
          className="md:w-full flex gap-1"
          onSubmit={handleSubmit}
          // onSubmit={(e) => {
          //   e.preventDefault();
          //   handleSubmit(e);
          // }}
        >
          <input
            onChange={handleInputChange}
            value={input}
            className="p-2 md:py-3 md:px-5 flex-1 rounded-full text-black md:text-xl border-2 border-gray-50 focus:outline-none focus:border-blue-500"
            type="text"
            placeholder="write your name ?"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs px-3 md:text-lg md:px-5 cursor-pointer focus:outline-none disabled:bg-blue-400"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
