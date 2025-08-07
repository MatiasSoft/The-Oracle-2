import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export interface ValidationAnalysis {
  appliedTechniques: string[];
  functionalEquivalence: string;
  implementationAnalysis: string;
}

export const rewriteCode = async (originalCode: string, instructions: string, seed?: number): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const prompt = `Actúa como un generador de variantes de código Python. Tu tarea es recibir un script y crear una versión alternativa.

**PROCESO DE DECISIÓN OBLIGATORIO:**

** Elige **una o más** de las siguientes técnicas de modificación para aplicar al código original.

    **Técnicas de Modificación :**
    1.  **Modificación de Comentarios:** Elimina, cambia o agrega nuevos comentarios en el código. Los comentarios deben relacionarse con la lógica del código, no sobre el proceso de generación.
    2.  **Cambio de Formato:** Modifica los espacios en blanco, indentación y formato general (PEP 8) sin afectar la lógica.
    3.  **Renombrado de Identificadores:** Cambia los nombres de variables, funciones, clases y otros identificadores por nombres equivalentes o menos descriptivos.
    4.  **Reordenación de Código:** Cambia el orden de bloques de código o de declaraciones (siempre que la lógica lo permita).
    5.  **Expresiones Alteradas:** Reordena los operandos o utiliza operadores equivalentes en expresiones (ej. a+b vs b+a).
    6.  **Cambio de Tipos de Datos:** Sustituye tipos de datos por otros que sean funcionalmente equivalentes (ej. una lista por una tupla si no se modificará).
    7.  **Instrucciones Redundantes:** Agrega variables o instrucciones que no afecten el resultado final del programa.
    8.  **Estructuras de Control Equivalentes:** Reemplaza estructuras como \`if-elif-else\` por un diccionario o múltiples \`if\` anidados, o un bucle \`for\` por un \`while\`.
    9.  **Modificación de Funcionalidad:** Agrega o elimina funciones o comportamiento que no impacten la funcionalidad principal del script, como funciones de registro o impresiones de depuración.

**REGLAS ESTRICTAS DE SALIDA (APLICAN A AMBAS ESTRATEGIAS):**
- El código generado debe ser **sintácticamente correcto** y **ejecutable**.
- **NO** agregues explicaciones, texto introductorio, ni formato markdown como \`\`\`python.
- **NO** incluyas comentarios que expliquen las técnicas que usaste o que esta es una versión generada (ej: "# Versión con bucle while", "# Código generado por IA").
- **SOLO** devuelve el código Python puro. Tu respuesta debe ser directamente el código, sin nada más antes o después.
- Genere una versión que no haya generado previamente si se le solicita varias veces.

**Código Original:**
\`\`\`python
${originalCode}
\`\`\`
${instructions ? `
**Instrucciones Adicionales del Usuario (estas instrucciones tienen prioridad sobre la selección aleatoria de técnicas):**
${instructions}
` : ''}

**Nuevo Código Python:**
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                ...(seed && { seed })
            }
        });
        
        let newCode = response.text.trim();
        // Clean up markdown fences if the model includes them despite instructions
        if (newCode.startsWith('```python')) {
            newCode = newCode.substring(9);
        }
        if (newCode.endsWith('```')) {
            newCode = newCode.substring(0, newCode.length - 3);
        }
        return newCode.trim();
    } catch (error) {
        console.error("Error calling Gemini API for rewrite:", error);
        throw new Error("Failed to generate rewritten code.");
    }
};



export const validateCode = async (originalCode: string, generatedCode: string): Promise<ValidationAnalysis> => {
    const model = 'gemini-2.5-flash';

    const schema = {
      type: Type.OBJECT,
      properties: {
        appliedTechniques: {
          type: Type.ARRAY,
          description: "Lista de las técnicas de modificación que fueron aplicadas al código original.",
          items: { type: Type.STRING }
        },
        functionalEquivalence: {
          type: Type.STRING,
          description: "Análisis conciso (1-2 frases) sobre si el código generado es funcionalmente equivalente al original."
        },
        implementationAnalysis: {
            type: Type.STRING,
            description: "Evaluación concisa (1-2 frases) de si el cambio es trivial o representa un enfoque algorítmico diferente."
        }
      },
      required: ["appliedTechniques", "functionalEquivalence", "implementationAnalysis"]
    };

    const prompt = `
Eres un ingeniero de software senior experto en Python. Tu tarea es analizar dos fragmentos de código: uno original y una versión generada.

Tu objetivo es identificar qué técnicas de modificación, de la lista provista, se usaron para crear la versión generada. Luego, analiza la equivalencia funcional y la naturaleza de la implementación.


**Técnicas de Modificación Posibles a Identificar:**
** Esta puede aparecer pero sola (no acompañada de otras tecnicas)**
- Copia Literal
**Estas pueden aparecer solas o en conjunto con otras**
- Modificación de Comentarios
- Cambio de Formato
- Renombrado de Identificadores
- Reordenación de Código
- Expresiones Alteradas
- Cambio de Tipos de Datos
- Instrucciones Redundantes
- Estructuras de Control Equivalentes
- Modificación de Funcionalidad

**Análisis Requerido:**
Devuelve tu análisis en un formato JSON que se ajuste estrictamente al esquema proporcionado. No incluyas explicaciones adicionales fuera del JSON.

1.  **appliedTechniques**: Un array de strings con los nombres exactos de las técnicas que detectaste de la lista anterior.
2.  **functionalEquivalence**: Un string de 1-2 oraciones que resuma si el código generado es funcionalmente idéntico. Menciona errores si los encuentras.
3.  **implementationAnalysis**: Un string de 1-2 oraciones que evalúe si el cambio es trivial o si representa un enfoque algorítmico significativamente diferente.

**Código Original:**
\`\`\`python
${originalCode}
\`\`\`

**Código Generado:**
\`\`\`python
${generatedCode}
\`\`\`
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling or parsing Gemini API for validation:", error);
        throw new Error("Failed to get or parse code validation.");
    }
};