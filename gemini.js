// Importa el SDK oficial de Google Generative-AI
import { GoogleGenerativeAI } from "@google/generative-ai";

// Exporta la función que Vercel convertirá en un endpoint de API
// Esta función se ejecutará en el servidor, no en el navegador del cliente.
export default async function handler(req, res) {
  // 1. Verifica que la solicitud sea de tipo POST para mayor seguridad.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Obtiene la clave de API de las variables de entorno de Vercel.
  // ¡Esta es la parte clave para la seguridad! La clave nunca se expone al público.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "La clave de API de Gemini no está configurada en el servidor." });
  }

  try {
    // 3. Extrae el prompt y la imagen del cuerpo de la solicitud que envía el navegador.
    const { prompt, image } = req.body;
    
    // 4. Inicializa el cliente de Google AI con la clave segura.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let result;
    if (image && image.data) {
      // Si se envió una imagen, prepara las partes para una llamada multimodal.
      const imageParts = [
        {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        },
      ];
      result = await model.generateContent([prompt, ...imageParts]);
    } else {
      // Si no hay imagen, es una llamada de solo texto.
      result = await model.generateContent(prompt);
    }
    
    // 5. Procesa la respuesta de la IA y la envía de vuelta al navegador.
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ text });

  } catch (error) {
    // 6. Manejo de errores detallado para facilitar la depuración.
    console.error("Error en la función de Gemini:", error);
    res.status(500).json({ error: `Error interno del servidor: ${error.message}` });
  }
}
