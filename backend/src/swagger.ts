import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "routes da aplicação",
      version: "1.0.0",
      description: "Documentação da API"
    }
  },
  apis: ["./src/routes/**/*.ts"]
};

const swaggerSpec = swaggerJsdoc(options);
//console.log(swaggerSpec.paths)
export default swaggerSpec;