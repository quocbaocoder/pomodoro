import { GoogleGenAI, FunctionDeclaration, Type, Content, GenerateContentResponse, Tool } from "@google/genai";
import { AIMode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const addHomeworkTool: FunctionDeclaration = {
  name: 'addHomework',
  description: 'Thêm một bài tập về nhà mới vào danh sách công việc của người dùng. Hỏi môn học, mô tả công việc và hạn chót nếu chưa được cung cấp.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject: {
        type: Type.STRING,
        description: 'Môn học của bài tập, ví dụ: "Toán", "Lịch sử".',
      },
      task: {
        type: Type.STRING,
        description: 'Mô tả chi tiết về công việc cần hoàn thành.',
      },
      deadline: {
        type: Type.STRING,
        description: 'Ngày hết hạn của công việc. Phải ở định dạng YYYY-MM-DD. Tính toán ngày nếu người dùng cung cấp ngày tương đối như "ngày mai" hoặc "thứ sáu tới".',
      },
    },
    required: ['subject', 'task', 'deadline'],
  },
};

const deleteHomeworkTool: FunctionDeclaration = {
  name: 'deleteHomework',
  description: 'Xóa một bài tập về nhà khỏi danh sách của người dùng dựa trên mô tả của nó.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      task: {
        type: Type.STRING,
        description: 'Mô tả của công việc cần xóa. Ví dụ: "Bài luận lịch sử về Đế chế La Mã".',
      },
    },
    required: ['task'],
  },
};

const completeHomeworkTool: FunctionDeclaration = {
  name: 'completeHomework',
  description: 'Đánh dấu một bài tập về nhà là đã hoàn thành dựa trên mô tả của nó.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      task: {
        type: Type.STRING,
        description: 'Mô tả của công việc cần đánh dấu là đã hoàn thành. Ví dụ: "Bài tập giải tích".',
      },
    },
    required: ['task'],
  },
};

type FunctionCall = {
  name: string;
  args: any;
};

type AIResponse = {
  text?: string | null;
  functionCall?: FunctionCall | null;
}

export const askAI = async (prompt: string, history: Content[], mode: AIMode): Promise<AIResponse> => {
    try {
        let systemInstruction: string;
        let tools: Tool[] | undefined;

        if (mode === 'tasks') {
            systemInstruction = `Bạn là một trợ lý học tập AI thân thiện, khích lệ và hữu ích tên là FocusFlow AI. 
            Mục tiêu của bạn là giúp người dùng quản lý việc học, duy trì động lực và hiểu các chủ đề phức tạp. 
            Bạn là chuyên gia về các kỹ thuật học tập và nhiều môn học khác nhau. 
            Hãy trả lời bằng giọng điệu trò chuyện và hỗ trợ. 
            Tất cả các câu trả lời của bạn phải bằng tiếng Việt.
            Khi tính toán deadline, hãy giả sử ngày hiện tại là ${new Date().toLocaleDateString('en-CA')}.`;
            tools = [{ functionDeclarations: [addHomeworkTool, deleteHomeworkTool, completeHomeworkTool] }];
        } else { // mode === 'study'
            systemInstruction = `Bạn là một người bạn học AI thân thiện và hiểu biết. Mục tiêu của bạn là giúp học sinh hiểu các chủ đề phức tạp bằng cách cung cấp các giải thích rõ ràng, từng bước.
            Hãy giải thích các khái niệm một cách đơn giản, như thể bạn đang nói chuyện với một học sinh trung học.
            Tránh đưa ra câu trả lời trực tiếp cho các câu hỏi bài tập về nhà; thay vào đó, hãy hướng dẫn người dùng tự tìm câu trả lời.
            Tất cả các câu trả lời của bạn phải bằng tiếng Việt.`;
            tools = undefined; // No function calling for study mode
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
            }
        });
        
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0];
            return { functionCall: { name: fc.name, args: fc.args } };
        }

        return { text: response.text };

    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        return { text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau." };
    }
};