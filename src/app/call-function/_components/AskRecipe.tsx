'use client';

import { useActionState } from 'react';
import { askRecipe } from '../actions';
import Form from 'next/form';

export const AskRecipe = () => {
  const [state, action, isPending] = useActionState(askRecipe, []);

  return (
    <div>
      <Form action={action}>
        <input
          name="prompt"
          type="text"
          placeholder="Ask Recipe"
          value="いくつかの日本料理のレシピを日本語で教えて"
        />
        <button type="submit">Submit</button>
      </Form>
      {isPending && <p>Loading...</p>}
      <div>
        {state.map((recipe) => (
          <div key={recipe.id}>
            <h2 className="text-lg">{recipe.recipeName}</h2>
            <div className="pl-4">
              {recipe.materials.map((material) => (
                <li key={material.id} className="space-x-4">
                  <span>{material.materialName}</span>
                  <span>{material.quantity}</span>
                </li>
              ))}
            </div>
          </div>
        ))}
      </div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};
