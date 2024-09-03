# Langchain.js 入门课

## 环境变量配置

本项目使用 OpenAI 的 LLM 和 Embedding 的 API，可以选择 OpenAI 官方 API 或者使用 Azure OpenAI 服务，如果使用其他 LLM 和 Embedding API，请自行查阅 langchain.js 和对应 API 的文档。

如果你是 OpenAI 官方 API 用户，在 .env 中配置以下环境变量：

```shell
OPENAI_API_KEY=<your-key>
```

如果你使用的 Azure OpenAI 服务，需要在 .env 配置以下环境变量：

创建和部署 Azure OpenAI 服务的教程可以参考 [这里](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal)， 以及其他 Azure OpenAI 官方文档和教程。

```shell
AZURE_OPENAI_API_KEY=abc
AZURE_OPENAI_API_VERSION=abc
AZURE_OPENAI_API_DEPLOYMENT_NAME=abc
AZURE_OPENAI_API_INSTANCE_NAME=abc
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=abc
```

- AZURE_OPENAI_API_KEY 是你部署的服务的 Key, 可以在下图中的 密钥和终结点中找到。
- AZURE_OPENAI_API_VERSION 是使用的 API 版本，本课程使用的是 2024-05-01-preview。
- AZURE_OPENAI_API_INSTANCE_NAME 是你部署服务的名称，也就是下面截图左上角打码部分的名称
- AZURE_OPENAI_API_DEPLOYMENT_NAME 是你部署的模型实例的名称，如不理解可参考 [这里](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal#deploy-a-model) 对 Deployment name 的概念介绍。
- AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME 是你用于 embedding 的模型实例名称。

![Azure OpenAI](./assets/aoai.png)

## RAG
