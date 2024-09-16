import Groq from 'groq-sdk';


/**
 * @example
 *  'max duration of operations for the month of september 2024'
 * @param {*} naturalQuery 
 * @returns 
 */
export async function generateAggregatePipeline(naturalQuery="") {
    const groq = new Groq();

    if(!naturalQuery){
        throw new Error('Empty natural query')
    }
  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": `Instruction as a list of rules:\n- Generate mogoose aggregate query (pipeline array as string)\n- Specifics:\nHere are the models:\nconst ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
});\nconst MetricSchema = new mongoose.Schema({\n  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },\n  operation: String,\n  startTime: Date,\n  endTime: Date,\n  duration: Number,\n  tags: Object,\n});\n- Here is the natural language instruction to build the query:\n"${naturalQuery}"\n- Output a computed pipeline array as string without any added details/text\n\n\n`
      },
      {
        "role": "assistant",
        "content": "[{\"$match\":{\"$expr\":{\"$and\":[{\"$eq\":[{\"$month\":\"$startTime\"},8]},{\"$eq\":[{\"$year\":\"$startTime\"},2024]}]}}},{\"$group\":{\"_id\":\"$operation\",\"maxDuration\":{\"$max\":\"$duration\"}}},{\"$sort\":{\"maxDuration\":-1}}]"
      },
      {
        "role": "user",
        "content": "Adapt the pipeline if needed and and remove text \"Here is the generated Mongoose aggregate pipeline array as a string:\""
      }
    ],
    "model": process.env.GROQ_MODEL||"llama3-70b-8192",
    "temperature": 1,
    "max_tokens": parseInt(process.env.GROQ_MAX_TOKENS||2048),
    "top_p": 1,
    "stream": false,
    "stop": null
  });

  return chatCompletion.choices[0].message.content;
}

export default function(app){
    // Expose a route to retrieve result from generateAggregatePipeline
    app.post('/api/generate-aggregate-query', async (req, res) => {
        try {
            const { naturalQuery } = req.body;
            const result = await generateAggregatePipeline(naturalQuery);
            res.json({ query: result });
        } catch (error) {
            console.log('generateAggregatePipeline',{
                error
            })
            res.status(500).json({ error: error.message });
        }
    });
}
