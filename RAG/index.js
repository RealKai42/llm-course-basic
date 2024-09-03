import { TABLE_NAME, DB_URI } from "./constant.js";
import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(currentDir, "../.env") });

// 连接数据库
const db = await lancedb.connect(DB_URI);
const table = await db.openTable(TABLE_NAME);

const embeddings = new OpenAIEmbeddings();

const contextRetrieverChain = RunnableSequence.from([
  (input) => input.question,
  async (question) => {
    const queryVector = await embeddings.embedQuery(question);
    const relatedDocs = await table.vectorSearch(queryVector).limit(4).toArray();

    return relatedDocs.map((doc) => doc.content).join("\n -----------  \n");
  },
]);

// 用于测试 contextRetrieverChain
// const result = await contextRetrieverChain.invoke({ question: "茴香豆是做什么用的" });
// console.log(result);

// 构建 chatPrompt
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个熟读鲁迅的《孔乙己》的终极原著党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，`,
  ],
  [
    "user",
    `
以下是原文中跟用户回答相关的内容：
{context}

现在，你需要基于原文，回答以下问题：
{question}
`,
  ],
]);
const model = new ChatOpenAI({
  // 设置为 true 时，会输出更多的信息，方便调试
  //   verbose: true,
});

const ragChain = RunnableSequence.from([
  // chain 中的第一个节点
  {
    // 根据用户的输入获取 context。 输入是整个 chain 的输出，返回值赋值给 context
    context: contextRetrieverChain,
    // 将输入中的 question 赋值给 question，也就是将用户的输入传递给下一个节点
    question: (input) => input.question,
  },
  // 这个节点的输入是一个对象，包含了 context 和 question
  prompt,
  model,
  // 提取模型中的文本输出
  new StringOutputParser(),
]);

const result = await ragChain.invoke({ question: "茴香豆是做什么用的" });
console.log(result);
