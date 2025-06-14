const AWS = require('aws-sdk');
const { createResponse, validateBody } = require('../../utils/response');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { matchId } = event.pathParameters;
    const body = validateBody(event.body, ['updates']);
    
    // Get current match data
    const matchResult = await dynamodb.get({
      TableName: process.env.MATCHES_TABLE,
      Key: { matchId }
    }).promise();
    
    if (!matchResult.Item) {
      return createResponse(404, {
        message: 'Match not found'
      });
    }
    
    const match = matchResult.Item;
    
    // Apply updates
    if (body.updates.scores) {
      body.updates.scores.forEach(scoreUpdate => {
        const player = match.players.find(p => p.playerId === scoreUpdate.playerId);
        if (player) {
          player.score = scoreUpdate.score;
        }
      });
    }
    
    if (body.updates.playerStatus) {
      body.updates.playerStatus.forEach(statusUpdate => {
        const player = match.players.find(p => p.playerId === statusUpdate.playerId);
        if (player) {
          player.status = statusUpdate.status;
        }
      });
    }
    
    match.updatedAt = Date.now();
    
    // Save updated match
    await dynamodb.put({
      TableName: process.env.MATCHES_TABLE,
      Item: match
    }).promise();
    
    return createResponse(200, {
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return createResponse(500, {
      message: 'Failed to update match',
      error: error.message
    });
  }
};