"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type HistoryItem = {
    id: string;
    created_at: string;
    created_at_ts: number;
};

const History = () => { 
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedSessionId = searchParams.get("sessionId");

    useEffect(() => {
        const fetchHistory = async () => {
            const history = await fetch(
                `/api/sessions`
            ).then(res => res.json());
            console.log("sessions--------", history);
            const updatedHistory: HistoryItem[] = history.map((item: any) => {
                const createdAt = new Date(item.created_at);
                return {
                    id: String(item.id),
                    created_at: createdAt.toLocaleString(undefined, { hour12: true }),
                    created_at_ts: createdAt.getTime(),
                };
            });
            updatedHistory.sort((a, b) => b.created_at_ts - a.created_at_ts);
            setHistory(updatedHistory);
        };
        fetchHistory();
    }, []);

    const handleSessionClick = (id: string) => {
        console.log("sessionId--------", id);
        router.push(`/chat?sessionId=${id}`);
    };

    console.log("sessionId--------", history);
    return <div className="flex-1 overflow-y-auto  h-full border-r border-gray-300 bg-right-gray-300">
    <h1 className="text-center text-2xl font-bold p-2 m-2  border-2 border-gray-300 rounded-md">History of the chat</h1>
    {history?.length > 0 && history?.map((item) => {
        const isSelected = selectedSessionId === String(item.id);
        return (
          <div
            key={item.id}
            className={`border-b border-b-gray-300 p-2 py-4 text-center text-lg cursor-pointer ${
            isSelected ? "border-r-8 border-r-blue-500" : " border-r-8 border-r-black"
            }  `}
            onClick={() => handleSessionClick(item.id)}
          >
            <h1>{item.created_at}</h1>
          </div>
        );
    })}
  </div>;
};

export default History;