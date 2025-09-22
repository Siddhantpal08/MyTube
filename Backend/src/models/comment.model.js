import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: { type: String, required: true },
    video: { // For your internal videos
        type: Schema.Types.ObjectId,
        ref: 'Video'
    },
    youtubeVideoId: { // NEW: For external YouTube videos
        type: String,
        index: true,
    },
    owner: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
    }
}, { timestamps: true });


commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment", commentSchema);