// import myAssistant from "../../config/getAssitantApiModel.js";
import openai from "../../config/openaiClient.js";

export async function chat(req, res) {
    try {
        if (!req.body.data) {
            return res.status(400).json({ code: 0, message: "Please initiate chat" });
        }
        const threadAvailable = req.body.threadId && req.body.threadId != null;
        let threadId = null;
        if (threadAvailable) {
            threadId = req.body.threadId;
        }
        if (!threadAvailable) {
            const thread = await openai.beta.threads.create()
            threadId = thread.id;
        }
        const threadMessages = await openai.beta.threads.messages.create(
            threadId,
            { role: "user", content: req.body.data }
        );
        let run = await openai.beta.threads.runs.createAndPoll(
            threadId,
            {
                assistant_id: 'asst_j7ilC4Jx8p9Sab3GJ0GvTpM1', // Remove this hardcoded assistant id
            }
        );
        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(
                run.thread_id
            );
            for (const message of messages.data.reverse()) {
                console.log(`${message.role} > ${message.content[0].text.value}`);
            }
        }
        else if (run.status == "requires_action") {
            await this.handleRequiresAction(
                run,
                run.id,
                run.thread_id,
            );
        } else {
            console.log(run.status);
            console.log(run)
        }
        res.status(200).json({
            code: 1, message: 'Chat response', data: {
            thread_id: threadId
        } });
    }
    catch (err) {
        console.log("Caught error in controller.chatbot.controller() due to: ");
        console.error(err);
        res.status(500).json({ code: -1, message: "Failed to process request." });
    }
}


export async function getMessagesListInThread(req, res) {
    try {
        const id = req.query.id;
        if (!id)
            return res.status(400).json({ code: 0, message: "Please provide valid thread id." });
        const messages = await openai.beta.threads.messages.list(id);
        const data = [];
        for (const d of messages.data.sort((a, b) => a.created_at - b.created_at)) {
            const current = {
                type: d.role,
                created_at: d.created_at,
                text: []
            };
            for (const t of d.content) {
                current.text.push(t.text.value);
            }
            data.push(current);
        }
        res.status(200).json({ code: 1, message: 'Chat response', data: data });
    }
    catch (err) {
        console.log("Caught error in controller.chatbot.controller() due to: ");
        console.error(err);
        res.status(500).json({ code: -1, message: "Failed to process request." });
    }
}