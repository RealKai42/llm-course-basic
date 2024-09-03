import { TextLoader } from "langchain/document_loaders/fs/text";
import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";
import path from "path";
import { fileURLToPath } from "url";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(currentDir, "../.env") });

// 加载 vector store （lanceDB）
const TABLE_NAME = "kong";
// 需根据使用的 embedding 模型生成的 vector size 进行修改
const EMBEDDING_VECTOR_SIZE = 1536;
const DB_URI = path.join(currentDir, "../db");
const db = await lancedb.connect(DB_URI);

const tableNames = await db.tableNames();
if (!tableNames.includes(TABLE_NAME)) {
  const schema = new arrow.Schema([
    // index 标记是文章的第几块
    new arrow.Field("index", new arrow.Int32()),
    // vector 是文章的 embedding 后的 vector
    new arrow.Field(
      "vector",
      new arrow.FixedSizeList(
        EMBEDDING_VECTOR_SIZE,
        new arrow.Field("item", new arrow.Float32(), true)
      )
    ),
    new arrow.Field("lines_from", new arrow.Int32()),
    new arrow.Field("lines_to", new arrow.Int32()),
    // content 该块的内容
    new arrow.Field("content", new arrow.Utf8()),
  ]);

  const empty_tbl = await db.createEmptyTable(TABLE_NAME, schema);
  console.log(`Created ${TABLE_NAME} table:`, empty_tbl);
} else {
  console.log(`${TABLE_NAME} table already exists`);
}

// 加载数据源
const loader = new TextLoader(path.join(currentDir, "../data/kong.txt"));
const docs = await loader.load();

// 对长文章进行切块
const splitter = new RecursiveCharacterTextSplitter({
  // 每块的长度
  chunkSize: 500,
  // 块之间的重叠长度
  chunkOverlap: 100,
});
/**
 * splitDocs 是切块后的结果
 * 其每一部分结构是 
    Document {
        pageContent: "xxxx",
        metadata: { source: "data/qiu.txt", loc: { lines: { from: 35, to: 42 } } }
    }
 * */
const splitDocs = await splitter.splitDocuments(docs);

// 创建将切块后的 content 进行 embedding 的实例，其作用是将文本转换成向量（vector），方便之后进行检索
const embeddings = new OpenAIEmbeddings();

// 创建 table 实例
const table = await db.openTable(TABLE_NAME);

// 将切块后的 content 进行 embedding
for (let i = 0; i < splitDocs.length; i++) {
  const doc = splitDocs[i];
  console.log(`Embedding ${i + 1}/${splitDocs.length}...`);
  const vector = await embeddings.embedQuery(doc.pageContent);
  await table.add([
    {
      index: i,
      vector: vector,
      lines_from: doc.metadata?.loc?.lines?.from,
      lines_to: doc.metadata?.loc?.lines?.to,
      content: doc.pageContent,
    },
  ]);
  console.log(`Embedded ${i + 1}/${splitDocs.length}`);
}
