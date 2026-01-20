type ChatMessage = {
    role: "user" | "assistant";
    content: string;
    citations?: {
      index: number;
      documentName: string;
      chunkIndex: number;
      content: string;
    }[];
  };
  
  export function AssistantMessage({ message }: { message: ChatMessage }) {
    return (
      <div className="space-y-3">
        {/* Answer */}
        <p className="whitespace-pre-wrap text-sm">
          {message.content}
        </p>
  
        {/* Citations */}
        {message?.citations?.length && message?.citations?.length > 0 && (
          <div className="space-y-2 rounded-md bg-yellow-50 p-3 border border-yellow-200">
            <div className="text-xs font-semibold text-yellow-800">
              📌 Evidence
            </div>
  
            {message?.citations?.map((c) => (
              <div
                key={String(c.index)}
                className="text-xs leading-relaxed bg-yellow-100 px-2 py-1 rounded"
              >
                <span className="font-semibold">
                  [{c.index}] {c.documentName} · chunk {c.chunkIndex}
                </span>
                <div className="mt-1 italic text-gray-700">
                  “{c.content}”
                </div>  
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  