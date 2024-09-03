import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(currentDir, "../.env") });

async function basicModel() {
  // 直接调用模型
  const chatModel = new ChatOpenAI();
  // chat model 的参数要求是一组 message
  const res = await chatModel.invoke([
    new SystemMessage("你是一个非常有趣的 AI，会用非常严肃的口吻讲笑话"),
    new HumanMessage("讲个笑话"),
  ]);

  console.log(res);
}

// 基础的 LCEL Chain
async function basicChain() {
  const chatModel = new ChatOpenAI();
  // 定义 outputParse， 其作用是解析 AI 的输出，将其中的文本部分提取出来
  const outputPrase = new StringOutputParser();

  // 通过 pipe 连接成 chain
  const simpleChain = chatModel.pipe(outputPrase);

  const res = await simpleChain.invoke([new HumanMessage("Tell me a joke")]);
  console.log(res);
}

async function basicChatChain() {
  // 构建 chatPrompt
  const prompt = ChatPromptTemplate.fromMessages([
    // fromMessages 中可以使用的简化的语法。 tone 是变量
    ["system", "你是一个非常有趣的 AI，会用非常{tone}的口吻讲笑话"],
    ["human", "讲个关于{topic}的笑话"],
  ]);
  const chatModel = new ChatOpenAI({
    // 设置为 true 时，会输出更多的信息，方便调试
    verbose: true,
  });
  // 定义 outputParse， 其作用是解析 AI 的输出，将其中的文本部分提取出来
  const outputPrase = new StringOutputParser();

  // 构建 chain 的简化用法，等价于 pipe
  const chatChain = RunnableSequence.from([prompt, chatModel, outputPrase]);

  const res = await chatChain.invoke({ topic: "猫", tone: "二次元" });
  console.log(res);
}

function main() {
  //   basicModel();
  //   basicChain();
  //   basicChatChain();
}

main();
