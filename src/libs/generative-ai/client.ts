import {
	type Schema,
	type FunctionDeclaration,
	GoogleGenerativeAI,
	SchemaType,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
	process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
);

const controlFunctionDeclaration: FunctionDeclaration = {
	name: "generateId",
	parameters: {},
} as FunctionDeclaration;

const functions = {
	generateId: () => {
		return Math.floor(Math.random() * 1000);
	},
};

export const defaultModel = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
	tools: [{ functionDeclarations: [controlFunctionDeclaration] }],
});

const schema = {
	description: "you are required to list a few popular cookie recipes",
	type: SchemaType.ARRAY,
	items: {
		type: SchemaType.OBJECT,
		description: "List of materials",
		properties: {
			id: {
				type: SchemaType.INTEGER,
				description: "id of the recipe",
				nullable: false,
			},
			recipeName: {
				type: SchemaType.STRING,
				description: "Name of the recipe",
				nullable: false,
			},
			materials: {
				type: SchemaType.ARRAY,
				description: "List of materials",
				items: {
					type: SchemaType.OBJECT,
					description: "Material",
					properties: {
						id: {
							type: SchemaType.INTEGER,
							description: "id of the material",
							nullable: false,
						},
						materialName: {
							type: SchemaType.STRING,
							description: "Name of the material",
							nullable: false,
						},
						quantity: {
							type: SchemaType.STRING,
							description: "Quantity of the material",
							nullable: false,
						},
					},
				},
			},
		},
		required: ["recipeName"],
	},
};
export const jsonModal = genAI.getGenerativeModel({
	model: "gemini-1.5-pro",
	generationConfig: {
		responseMimeType: "application/json",
		responseSchema: schema,
	},
});

export const getModal = (schema: Schema) =>
	genAI.getGenerativeModel({
		model: "gemini-1.5-pro",
		generationConfig: {
			responseMimeType: "application/json",
			responseSchema: schema,
		},
	});
