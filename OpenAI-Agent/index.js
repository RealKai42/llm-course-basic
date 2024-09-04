import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent, createReactAgent } from "langchain/agents";
import { z } from "zod";
import { Calculator } from "@langchain/community/tools/calculator";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(currentDir, "../.env") });

// 创建自定义 tool，openAI-agent 支持 DynamicStructuredTool 和 DynamicTool，也就是支持多输入和单输入的工具，
// 提供了构建更复杂的工具的能力
const dateDiffTool = new DynamicStructuredTool({
  name: "date-difference-calculator",
  description: "计算两个日期之间的天数差",
  schema: z.object({
    date1: z.string().describe("第一个日期，以YYYY-MM-DD格式表示"),
    date2: z.string().describe("第二个日期，以YYYY-MM-DD格式表示"),
  }),
  func: async ({ date1, date2 }) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const difference = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    return days.toString();
  },
});

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
const tools = [new Calculator(), exchangeRateTool, dateDiffTool];

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["user", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const llm = new ChatOpenAI({
  temperature: 0,
  // 设置为 true，观察 AI 思考过程
  verbose: true,
});
const agent = await createOpenAIToolsAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const res = await agentExecutor.invoke({
  input:
    "你要回答我两个问题，一个是我有 20 美元这相当于多少人民币？ 另一个是 今年是 2024 年，今年 5.1 和 10.1 之间有多少天？",
});

/**
 输出 
 
{
  input: '你要回答我两个问题，一个是我有 20 美元这相当于多少人民币？ 另一个是 今年是 2024 年，今年 5.1 和 10.1 之间有多少天？',
  output: '1. 根据最新汇率，1 美元 = 7.12 人民币。因此，20 美元相当于 20 * 7.12 = 142.4 人民币。\n' +
    '\n' +
    '2. 2024 年 5 月 1 日和 2024 年 10 月 1 日之间有 153 天。'
}
 */
console.log(res);

// 完整调用 过程：
/**
 [llm/start] [1:llm:OpenAIToolsAgent] Entering LLM run with input: {
  "messages": [
    [
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "SystemMessage"
        ],
        "kwargs": {
          "content": "You are a helpful assistant",
          "additional_kwargs": {},
          "response_metadata": {}
        }
      },
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "HumanMessage"
        ],
        "kwargs": {
          "content": "你要回答我两个问题，一个是我有 20 美元这相当于多少人民币？ 另一个是 今年是 2024 年，今年 5.1 和 10.1 之间有多少天？",
          "additional_kwargs": {},
          "response_metadata": {}
        }
      }
    ]
  ]
}
[llm/end] [1:llm:OpenAIToolsAgent] [7.04s] Exiting LLM run with output: {
  "generations": [
    [
      {
        "text": "",
        "generationInfo": {
          "prompt": 0,
          "completion": 0,
          "finish_reason": "tool_calls",
          "system_fingerprint": "fp_abc28019ad"
        },
        "message": {
          "lc": 1,
          "type": "constructor",
          "id": [
            "langchain_core",
            "messages",
            "AIMessageChunk"
          ],
          "kwargs": {
            "content": "",
            "additional_kwargs": {
              "tool_calls": [
                {
                  "function": {
                    "arguments": "{\"input\": \"USD\"}",
                    "name": "exchange-rate-calculator"
                  },
                  "id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
                  "index": 0,
                  "type": "function"
                },
                {
                  "function": {
                    "arguments": "{\"date1\": \"2024-05-01\", \"date2\": \"2024-10-01\"}",
                    "name": "date-difference-calculator"
                  },
                  "id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
                  "index": 1,
                  "type": "function"
                }
              ]
            },
            "response_metadata": {
              "prompt": 0,
              "completion": 0,
              "finish_reason": "tool_calls",
              "system_fingerprint": "fp_abc28019ad"
            },
            "tool_call_chunks": [
              {
                "name": "exchange-rate-calculator",
                "args": "{\"input\": \"USD\"}",
                "id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
                "index": 0,
                "type": "tool_call_chunk"
              },
              {
                "name": "date-difference-calculator",
                "args": "{\"date1\": \"2024-05-01\", \"date2\": \"2024-10-01\"}",
                "id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
                "index": 1,
                "type": "tool_call_chunk"
              }
            ],
            "id": "chatcmpl-A3K0wk0ciusfRaJ7wd9Fxn6cKGIza",
            "tool_calls": [
              {
                "name": "exchange-rate-calculator",
                "args": {
                  "input": "USD"
                },
                "id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
                "type": "tool_call"
              },
              {
                "name": "date-difference-calculator",
                "args": {
                  "date1": "2024-05-01",
                  "date2": "2024-10-01"
                },
                "id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
                "type": "tool_call"
              }
            ],
            "invalid_tool_calls": []
          }
        }
      }
    ]
  ]
}
[llm/start] [1:llm:OpenAIToolsAgent] Entering LLM run with input: {
  "messages": [
    [
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "SystemMessage"
        ],
        "kwargs": {
          "content": "You are a helpful assistant",
          "additional_kwargs": {},
          "response_metadata": {}
        }
      },
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "HumanMessage"
        ],
        "kwargs": {
          "content": "你要回答我两个问题，一个是我有 20 美元这相当于多少人民币？ 另一个是 今年是 2024 年，今年 5.1 和 10.1 之间有多少天？",
          "additional_kwargs": {},
          "response_metadata": {}
        }
      },
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "AIMessageChunk"
        ],
        "kwargs": {
          "content": "",
          "additional_kwargs": {
            "tool_calls": [
              {
                "function": {
                  "arguments": "{\"input\": \"USD\"}",
                  "name": "exchange-rate-calculator"
                },
                "id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
                "index": 0,
                "type": "function"
              },
              {
                "function": {
                  "arguments": "{\"date1\": \"2024-05-01\", \"date2\": \"2024-10-01\"}",
                  "name": "date-difference-calculator"
                },
                "id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
                "index": 1,
                "type": "function"
              }
            ]
          },
          "response_metadata": {
            "prompt": 0,
            "completion": 0,
            "finish_reason": "tool_calls",
            "system_fingerprint": "fp_abc28019ad"
          },
          "tool_call_chunks": [
            {
              "name": "exchange-rate-calculator",
              "args": "{\"input\": \"USD\"}",
              "id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
              "index": 0,
              "type": "tool_call_chunk"
            },
            {
              "name": "date-difference-calculator",
              "args": "{\"date1\": \"2024-05-01\", \"date2\": \"2024-10-01\"}",
              "id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
              "index": 1,
              "type": "tool_call_chunk"
            }
          ],
          "id": "chatcmpl-A3K0wk0ciusfRaJ7wd9Fxn6cKGIza",
          "tool_calls": [
            {
              "name": "exchange-rate-calculator",
              "args": {
                "input": "USD"
              },
              "id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
              "type": "tool_call"
            },
            {
              "name": "date-difference-calculator",
              "args": {
                "date1": "2024-05-01",
                "date2": "2024-10-01"
              },
              "id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
              "type": "tool_call"
            }
          ],
          "invalid_tool_calls": []
        }
      },
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "ToolMessage"
        ],
        "kwargs": {
          "tool_call_id": "call_xtqW8jAFEY1giX3v7uuqRYHT",
          "content": "1 USD = 7.12 CNY",
          "additional_kwargs": {
            "name": "exchange-rate-calculator"
          },
          "response_metadata": {}
        }
      },
      {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "ToolMessage"
        ],
        "kwargs": {
          "tool_call_id": "call_ldLVRjAqdkMMMG6TUMQ5CQ58",
          "content": "153",
          "additional_kwargs": {
            "name": "date-difference-calculator"
          },
          "response_metadata": {}
        }
      }
    ]
  ]
}
[llm/end] [1:llm:OpenAIToolsAgent] [1.51s] Exiting LLM run with output: {
  "generations": [
    [
      {
        "text": "1. 根据最新汇率，1 美元 = 7.12 人民币。因此，20 美元相当于 20 * 7.12 = 142.4 人民币。\n\n2. 2024 年 5 月 1 日和 2024 年 10 月 1 日之间有 153 天。",
        "generationInfo": {
          "prompt": 0,
          "completion": 0,
          "finish_reason": "stop",
          "system_fingerprint": "fp_abc28019ad"
        },
        "message": {
          "lc": 1,
          "type": "constructor",
          "id": [
            "langchain_core",
            "messages",
            "AIMessageChunk"
          ],
          "kwargs": {
            "content": "1. 根据最新汇率，1 美元 = 7.12 人民币。因此，20 美元相当于 20 * 7.12 = 142.4 人民币。\n\n2. 2024 年 5 月 1 日和 2024 年 10 月 1 日之间有 153 天。",
            "additional_kwargs": {},
            "response_metadata": {
              "prompt": 0,
              "completion": 0,
              "finish_reason": "stop",
              "system_fingerprint": "fp_abc28019ad"
            },
            "tool_call_chunks": [],
            "id": "chatcmpl-A3K13YXiXrjqlyOzwu5DiW5pVnDyS",
            "tool_calls": [],
            "invalid_tool_calls": []
          }
        }
      }
    ]
  ]
}
{
  input: '你要回答我两个问题，一个是我有 20 美元这相当于多少人民币？ 另一个是 今年是 2024 年，今年 5.1 和 10.1 之间有多少天？',
  output: '1. 根据最新汇率，1 美元 = 7.12 人民币。因此，20 美元相当于 20 * 7.12 = 142.4 人民币。\n' +
    '\n' +
    '2. 2024 年 5 月 1 日和 2024 年 10 月 1 日之间有 153 天。'
}

 */
