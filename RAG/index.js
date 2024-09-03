import { TextLoader } from "langchain/document_loaders/fs/text";

// 加载数据源
const loader = new TextLoader("../data/qiu.txt");
const docs = await loader.load();
