import { Calculator } from "@langchain/community/tools/calculator";
import { DynamicTool } from "@langchain/community/tools/dynamic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(currentDir, "../.env") });

// 创建提供给 agent 的工具。 reAct 只支持 DynamicTool，也就是只有一个输入的工具
const exchangeRateTool = new DynamicTool({
  name: "exchange-rate-calculator",
  description: "获取人民币和美元之间的最新汇率。输入应为你当前的货币，'CNY' 或 'USD'。",
  func: async (input) => {
    // 硬编码的汇率
    const exchangeRate = 7.12;

    let result;
    if (input === "CNY") {
      result = `1 CNY = ${(1 / exchangeRate).toFixed(4)} USD`;
    } else if (input === "USD") {
      result = `1 USD = ${exchangeRate} CNY`;
    } else {
      throw new Error("输入格式不正确。请使用 'CNY' 或 'USD'。");
    }

    return result;
  },
});
const tools = [new Calculator(), exchangeRateTool];

const prompt = ChatPromptTemplate.fromTemplate(`
]Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}
`);
const llm = new ChatOpenAI({
  temperature: 0,
  // 设置为 true，观察 AI 思考过程
  verbose: true,
});

const agent = await createReactAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const result = await agentExecutor.invoke({
  input: "我有 17 美元，现在相当于多少人民币？",
});

console.log(result);

// 下述是 reAct 的思考过程
/**
Answer the following questions as best you can. You have access to the following tools:

calculator: Useful for getting the result of a math expression. The input to this tool should be a valid mathematical expression that could be executed by a simple calculator.
exchange-rate-calculator: 获取人民币和美元之间的最新汇率。输入应为你当前的货币，'CNY' 或 'USD'。

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [calculator, exchange-rate-calculator]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: 我有 17 美元，现在相当于多少人民币？
Thought:Thought: To determine how much 17 USD is in CNY, I need to get the latest exchange rate between USD and CNY.

Action: exchange-rate-calculator
Action Input: USD


Observation: 1 USD = 7.12 CNY
Thought: To find out how much 17 USD is in CNY, I need to multiply 17 by the exchange rate of 7.12.

Action: calculator
Action Input: 17 * 7.12

Observation: 121.04
Thought: I now know the final answer.

Final Answer: 17 美元相当于 121.04 人民币。
 */
