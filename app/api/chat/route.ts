import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const SYSTEM = `
You are an AI Medical Assistant.

Provide clear, helpful, and easy-to-understand general medical information.

Rules:
- Do not claim to diagnose diseases.
- Do not prescribe medicines or dosages.
- Encourage users to consult a qualified healthcare professional.
- For emergencies, advise contacting emergency services immediately.
- Explain medical terms in simple language.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body?.messages;
    const requestedConversationId = body?.conversationId || null;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please send a valid chat message.",
        },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL;

    if (!geminiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is missing in .env.local",
        },
        { status: 500 }
      );
    }

    if (!geminiModel) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_MODEL is missing in .env.local",
        },
        { status: 500 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Chat authentication error:", authError);

      return NextResponse.json(
        {
          success: false,
          error: "Your login session has expired. Please login again.",
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    const google = createGoogleGenerativeAI({
      apiKey: geminiKey,
    });

    const conversationMessages = messages
      .slice(-30)
      .map((message: any) => ({
        role: message?.role,
        content: String(message?.content || ""),
      }))
      .filter(
        (message: any) =>
          (message.role === "user" || message.role === "assistant") &&
          message.content.trim().length > 0
      );

    if (conversationMessages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    let result;

    try {
      result = await generateText({
        model: google(geminiModel),
        system: SYSTEM,
        messages: conversationMessages,
      });
    } catch (geminiError) {
      console.error("Gemini error:", geminiError);

      return NextResponse.json(
        {
          success: false,
          error:
            geminiError instanceof Error
              ? geminiError.message
              : "Unable to connect to Gemini.",
        },
        { status: 500 }
      );
    }

    const assistantText = result?.text?.trim();

    if (!assistantText) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    let activeConversationId = requestedConversationId;

    if (activeConversationId) {
      const { data: existingConversation, error: conversationCheckError } =
        await supabase
          .from("chat_conversations")
          .select("id")
          .eq("id", activeConversationId)
          .eq("user_id", userId)
          .maybeSingle();

      if (conversationCheckError) {
        console.error(
          "Conversation check error:",
          conversationCheckError
        );
      }

      if (!existingConversation) {
        activeConversationId = null;
      }
    }

    let newConversationCreated = false;

    if (!activeConversationId) {
      const firstUserMessage =
        messages.find((message: any) => message?.role === "user")
          ?.content || "Medical Chat";

      const firstMessageText = String(firstUserMessage);

      const title =
        firstMessageText.length > 60
          ? firstMessageText.substring(0, 60) + "..."
          : firstMessageText;

      const { data: conversation, error: conversationError } =
        await supabase
          .from("chat_conversations")
          .insert({
            user_id: userId,
            title,
          })
          .select("id")
          .single();

      if (conversationError) {
        console.error(
          "Conversation creation error:",
          conversationError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              conversationError.message ||
              "Unable to create chat conversation.",
          },
          { status: 500 }
        );
      }

      activeConversationId = conversation.id;
      newConversationCreated = true;
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find(
        (message: any) =>
          message?.role === "user" &&
          String(message?.content || "").trim()
      );

    if (latestUserMessage) {
      const { error: userMessageError } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: activeConversationId,
          user_id: userId,
          role: "user",
          content: String(latestUserMessage.content),
        });

      if (userMessageError) {
        console.error(
          "User message save error:",
          userMessageError
        );
      }
    }

    const { error: assistantMessageError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: activeConversationId,
        user_id: userId,
        role: "assistant",
        content: assistantText,
      });

    if (assistantMessageError) {
      console.error(
        "Assistant message save error:",
        assistantMessageError
      );
    }

    if (activeConversationId) {
      const { error: updateError } = await supabase
        .from("chat_conversations")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeConversationId)
        .eq("user_id", userId);

      if (updateError) {
        console.error(
          "Conversation update error:",
          updateError
        );
      }
    }

    /*
     * Add one history entry when a new conversation is created.
     */
    if (newConversationCreated && activeConversationId) {
      const firstUserMessage =
        messages.find((message: any) => message?.role === "user")
          ?.content || "Medical Chat";

      const { error: historyError } = await supabase
        .from("activity_history")
        .insert({
          user_id: userId,
          activity_type: "chat",
          description: `Started medical chat: ${String(firstUserMessage).substring(
            0,
            100
          )}`,
          reference_id: activeConversationId,
        });

      if (historyError) {
        console.error(
          "Chat history save error:",
          historyError
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        response: assistantText,
        conversationId: activeConversationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate a response.",
      },
      { status: 500 }
    );
  }
}

/*
 * CLEAR ALL CHAT DATA FOR THE LOGGED-IN USER
 */
export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Your login session has expired. Please login again.",
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    /*
     * Delete chat messages first.
     */
    const { error: messagesError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId);

    if (messagesError) {
      console.error("Chat messages delete error:", messagesError);

      return NextResponse.json(
        {
          success: false,
          error:
            messagesError.message ||
            "Unable to clear chat messages.",
        },
        { status: 500 }
      );
    }

    /*
     * Delete chat conversations.
     */
    const { error: conversationsError } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("user_id", userId);

    if (conversationsError) {
      console.error(
        "Chat conversations delete error:",
        conversationsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            conversationsError.message ||
            "Unable to clear chat conversations.",
        },
        { status: 500 }
      );
    }

    /*
     * Remove chat entries from activity history too.
     */
    const { error: historyError } = await supabase
      .from("activity_history")
      .delete()
      .eq("user_id", userId)
      .eq("activity_type", "chat");

    if (historyError) {
      console.error(
        "Chat history delete error:",
        historyError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Chat cleared successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Clear chat error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to clear chat.",
      },
      { status: 500 }
    );
  }
}