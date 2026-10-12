import gql from'graphql-tag';export default gql`
 type Habit { id:ID!,userId:ID!,name:String!,description:String,color:String!,frequency:String!,targetPerWeek:Int!,active:Boolean!,completedToday:Boolean!,currentStreak:Int!,bestStreak:Int!,completionRate:Float!,createdAt:String! }
 type HabitLog { id:ID!,habitId:ID!,completedOn:String!,note:String }
 type HabitPage { items:[Habit!]!,total:Int!,hasMore:Boolean! }
 input HabitInput { name:String!,description:String,color:String,frequency:String,targetPerWeek:Int }
 type Query { habits(limit:Int=20,offset:Int=0,active:Boolean):HabitPage!,habit(id:ID!):Habit,habitLogs(habitId:ID!,limit:Int=31,offset:Int=0):[HabitLog!]! }
 type Mutation { createHabit(input:HabitInput!):Habit!,updateHabit(id:ID!,input:HabitInput!):Habit!,archiveHabit(id:ID!):Boolean!,completeHabit(id:ID!,date:String,note:String):HabitLog!,uncompleteHabit(id:ID!,date:String):Boolean! }
`;
