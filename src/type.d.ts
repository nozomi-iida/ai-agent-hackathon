type Recipe = {
  id: number;
  recipeName: string;
  materials: {
    id: number;
    materialName: string;
    quantity: string;
  }[];
};
