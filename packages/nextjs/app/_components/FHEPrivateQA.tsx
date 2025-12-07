"use client";

import { useEffect, useMemo, useState } from "react";
import { useFhevm } from "@fhevm-sdk";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { useFHEPrivateQA } from "~~/hooks/useFHEPrivateQA";

export const FHEPrivateQA = () => {
  const { isConnected, chain } = useAccount();
  const chainId = chain?.id;

  const provider = useMemo(() => (typeof window !== "undefined" ? (window as any).ethereum : undefined), []);

  const initialMockChains = {
    11155111: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  };

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const qa = useFHEPrivateQA({ instance: fhevmInstance, initialMockChains });

  // Expanded to 4 questions (q1..q4)
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "", q4: "" });
  const [justSubmitted, setJustSubmitted] = useState(false);
  const allAnswered = answers.q1 && answers.q2 && answers.q3 && answers.q4;

  // Update correctAnswers to 4 chars
  const correctAnswers = "BCCC"; // B, B, A, C

  const handleSubmit = async () => {
    const answerString = `${answers.q1}${answers.q2}${answers.q3}${answers.q4}`;
    await qa.submitAnswer(answerString);
    setJustSubmitted(true);
  };

  // Load decrypted answer (now expecting up to 4 chars)
  useEffect(() => {
    if (qa.decryptedString) {
      const str = qa.decryptedString;
      setAnswers({
        q1: str[0] || "",
        q2: str[1] || "",
        q3: str[2] || "",
        q4: str[3] || "",
      });
    }
  }, [qa.decryptedString]);

  if (!isConnected) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center text-center"
        style={{ height: "calc(100vh - 60px)" }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-50">Connect your wallet to get started.</h2>
        <RainbowKitCustomConnectButton />
      </div>
    );
  }

  const showResult = Boolean(qa.decryptedString || justSubmitted);

  return (
    <div className="w-full min-h-[calc(100vh-60px)] text-gray-200 py-10">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-50">FHE Private QA</h1>
          <p className="text-gray-400 text-center mb-6">
            Answer all 4 questions, then submit to see if you're right — privately with FHE!
          </p>
        </motion.div>

        {renderQuestion(
          "1️⃣ What does Zama mainly work on?",
          ["A", "B", "C", "D"],
          ["Gaming", "Full Homomorphic Encryption (FHE)", "NFTs", "DeFi loans"],
          answers.q1,
          v => setAnswers(a => ({ ...a, q1: v })),
          qa.hasAnswered,
          showResult ? correctAnswers[0] : undefined,
        )}

        {renderQuestion(
          "2️⃣ What does FHE allow?",
          ["A", "B", "C", "D"],
          [
            "Data to be deleted",
            "Data stored offline",
            "Data to be computed without decrypting",
            "Data to become public",
          ],
          answers.q2,
          v => setAnswers(a => ({ ...a, q2: v })),
          qa.hasAnswered,
          showResult ? correctAnswers[1] : undefined,
        )}

        {renderQuestion(
          "3️⃣ Zama is mostly known as a ____ protocol.",
          ["A", "B", "C", "D"],
          ["Meme", "AI", "Privacy", "Trading"],
          answers.q3,
          v => setAnswers(a => ({ ...a, q3: v })),
          qa.hasAnswered,
          showResult ? correctAnswers[2] : undefined,
        )}

        {renderQuestion(
          "4️⃣ What can FHE keep private on-chain?",
          ["A", "B", "C", "D"],
          ["Wallet balance", "Smart contract code", "User data & transactions", "Profile picture"],
          answers.q4,
          v => setAnswers(a => ({ ...a, q4: v })),
          qa.hasAnswered,
          showResult ? correctAnswers[3] : undefined,
        )}

        {!qa.hasAnswered && (
          <motion.button
            onClick={handleSubmit}
            disabled={!allAnswered || qa.isProcessing}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 rounded-md font-semibold shadow-md bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 hover:brightness-110 disabled:opacity-50"
          >
            {qa.isProcessing ? "⏳ Submitting..." : "🚀 Submit My Answers"}
          </motion.button>
        )}

        {qa.hasAnswered && !qa.decryptedString && (
          <motion.button
            onClick={qa.decrypt}
            disabled={qa.isProcessing}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 rounded-md font-semibold shadow-md bg-gradient-to-r from-yellow-400 to-yellow-300 hover:brightness-110 disabled:opacity-50"
          >
            {qa.isProcessing ? "🔄 Decrypting..." : "🔓 Decrypt My Answer"}
          </motion.button>
        )}

        {qa.message && <p className="mt-4 text-center text-gray-400 italic">{qa.message}</p>}

        {showResult && qa.decryptedString && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-6 p-5 bg-[#071015] border border-gray-800 rounded-xl shadow-lg text-center"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-50">✅ Your Results</h3>
            <QuizResult decrypted={qa.decryptedString} correct={correctAnswers} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

function renderQuestion(
  title: string,
  labels: string[],
  options: string[],
  selected: string,
  onSelect: (val: string) => void,
  disabled: boolean,
  correctLabel?: string,
) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="bg-gradient-to-b from-[#071021] to-[#071018] p-5 rounded-[12px] shadow-lg mb-4 border border-gray-800"
    >
      <h3 className="text-lg font-semibold mb-3 text-gray-100">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const label = labels[i];
          const active = selected === label;
          const isCorrect = correctLabel && label === correctLabel;
          const isWrong = correctLabel && active && !isCorrect;

          let className = "p-3 rounded-md border transition-all text-left flex items-center gap-3 ";
          if (isCorrect && active) className += "bg-green-800 border-green-500 text-green-100 font-bold";
          else if (isWrong) className += "bg-red-800 border-red-500 text-red-100 font-bold";
          else if (active) className += "bg-yellow-300 border-yellow-400 text-gray-900 font-bold";
          else className += "bg-[#0b1114] border-gray-700 hover:bg-[#09121a] text-gray-200";

          return (
            <motion.button
              key={label}
              onClick={() => onSelect(label)}
              disabled={disabled}
              whileTap={{ scale: 0.985 }}
              whileHover={!disabled ? { scale: 1.01 } : {}}
              className={`${className} disabled:opacity-60`}
            >
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-transparent border border-gray-600 text-sm font-semibold">
                {label}
              </span>
              <div>
                <div className="text-sm">{opt}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function QuizResult({ decrypted, correct }: { decrypted?: string; correct: string }) {
  if (!decrypted) return <p className="text-gray-400">Waiting for decryption...</p>;

  const total = correct.length;
  let correctCount = 0;
  for (let i = 0; i < total; i++) if (decrypted[i] === correct[i]) correctCount++;

  const isPerfect = correctCount === total;

  return (
    <div className="mt-4 text-left max-w-2xl mx-auto">
      <p className="text-lg font-medium text-gray-100">
        Your answers: <span className="font-mono text-gray-200 ml-2">{decrypted}</span>
      </p>
      <p className="text-lg font-medium text-gray-100 mt-2">
        Correct answers: <span className="font-mono text-gray-200 ml-2">{correct}</span>
      </p>

      {isPerfect ? (
        <p className="text-green-400 font-semibold text-lg mt-4">🎉 Perfect! You got all {total} correct!</p>
      ) : (
        <p className="text-orange-400 font-semibold text-lg mt-4">
          ⚡ You got {correctCount}/{total} correct — nice try!
        </p>
      )}
    </div>
  );
}
