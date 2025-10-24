import { motion } from "framer-motion";

import { useMenu } from "../providers/menuProvider";
import { cn } from "@/lib/utils";
import {
  Rocket,
  LineChart,
  ArrowRight,
  Code,
  Coins,
  Wallet,
  Server,
  MessageSquare,
  Zap,
  BookOpenCheck,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "./ui/button";

const suggestions = [
  {
    title: "🌐 Somnia Basics",
    icon: <Rocket className="w-5 h-5" />,
    description: "Learn about the blockchain",
    prompts: [
      { text: "What is Somnia?", icon: <Zap className="w-4 h-4" /> },
      { text: "How do I get started with Somnia?", icon: <ArrowRight className="w-4 h-4" /> },
      { text: "What makes Somnia unique?", icon: <Code className="w-4 h-4" /> },
    ],
  },
  {
    title: "💼 Portfolio & Balance",
    icon: <Wallet className="w-5 h-5" />,
    description: "View your assets",
    prompts: [
      { text: "Show my balance", icon: <Wallet className="w-4 h-4" /> },
      { text: "Show my portfolio performance", icon: <TrendingUp className="w-4 h-4" /> },
      { text: "What's my total portfolio value?", icon: <Coins className="w-4 h-4" /> },
    ],
  },
  {
    title: "🎯 Staking & Rewards",
    icon: <Server className="w-5 h-5" />,
    description: "Earn passive income",
    prompts: [
      { text: "Stake 100 STT with the best validator", icon: <Server className="w-4 h-4" /> },
      { text: "Show my staking positions", icon: <Zap className="w-4 h-4" /> },
      { text: "How much can I earn by staking?", icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    title: "💱 Token Swaps",
    icon: <LineChart className="w-5 h-5" />,
    description: "Trade tokens easily",
    prompts: [
      { text: "Swap 1 ETH for STT with 1% slippage", icon: <Coins className="w-4 h-4" /> },
      { text: "What is the current price of STT?", icon: <LineChart className="w-4 h-4" /> },
      { text: "Show me token info for STT", icon: <MessageSquare className="w-4 h-4" /> },
    ],
  },
  {
    title: "🏛️ Governance",
    icon: <ShieldCheck className="w-5 h-5" />,
    description: "Participate in decisions",
    prompts: [
      { text: "Show governance proposals", icon: <BookOpenCheck className="w-4 h-4" /> },
      { text: "What are the active proposals?", icon: <ShieldCheck className="w-4 h-4" /> },
      { text: "How do I vote on proposals?", icon: <ArrowRight className="w-4 h-4" /> },
    ],
  },
  {
    title: "📊 Network Stats",
    icon: <LineChart className="w-5 h-5" />,
    description: "Track network metrics",
    prompts: [
      { text: "Show network metrics", icon: <TrendingUp className="w-4 h-4" /> },
      { text: "What's the current TPS?", icon: <Zap className="w-4 h-4" /> },
      { text: "Show Somnia network statistics", icon: <LineChart className="w-4 h-4" /> },
    ],
  },
];

interface ChatSuggestionsProps {
  onSuggestionClick: (prompt: string) => void;
}

const ChatSuggestions = ({ onSuggestionClick }: ChatSuggestionsProps) => {
  const { isCollapsed } = useMenu();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "w-full mb-4 mt-4 sm:mt-6 lg:mt-8",
        isCollapsed ? "pl-28 mx-auto" : "px-4 sm:px-6"
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pb-4">

        {suggestions.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            className="bg-black/40 backdrop-blur-sm rounded-xl p-2 sm:p-3 lg:p-4 border border-zinc-600/50 hover:border-zinc-400/50 transition-all duration-300 group shadow-lg w-full"
          >
            <div className="flex items-center gap-2 mb-1 sm:mb-2 lg:mb-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-800/50 text-zinc-300 group-hover:text-white group-hover:bg-zinc-800 transition-colors">
                {category.icon}
              </div>
              <div>
                <h3 className="text-sm sm:text-base text-zinc-200 font-medium group-hover:text-white transition-colors">
                  {category.title}
                </h3>
                <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {category.description}
                </p>
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1 lg:space-y-2 pl-8">
              {category.prompts.map((prompt) => (
                <Button
                  key={prompt.text}
                  variant="ghost"
                  className="w-full justify-start text-left text-xs sm:text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-200 rounded-xl h-6 sm:h-7 lg:h-8 px-2 sm:px-3 overflow-hidden"
                  onClick={() => onSuggestionClick(prompt.text)}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="text-zinc-500 group-hover:text-white transition-colors">
                      {prompt.icon}
                    </div>
                    <span className="line-clamp-1 text-xs overflow-hidden text-ellipsis">
                      {prompt.text}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ChatSuggestions;
