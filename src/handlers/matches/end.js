const AWS = require('aws-sdk');
const { createResponse, validateBody } = require('../../utils/response');
const { updateSkillRating } = require('../../utils/skillRating');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { matchId } = event.pathParameters;
    const body = validateBody(event.body, ['winningTeam']);
    
    // Get match data
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
    
    if (match.status === 'COMPLETED') {
      return createResponse(400, {
        message: 'Match already ended'
      });
    }
    
    // Calculate results
    const winners = match.players.filter(p => p.team === body.winningTeam);
    const losers = match.players.filter(p => p.team !== body.winningTeam);
    
    // Calculate average ratings for ELO
    const avgWinnerRating = winners.reduce((sum, p) => sum + p.skillRating, 0) / winners.length;
    const avgLoserRating = losers.reduce((sum, p) => sum + p.skillRating, 0) / losers.length;
    
    // Update player stats
    const updatePromises = [];
    
    // Update winners
    for (const winner of winners) {
      const newRating = updateSkillRating(winner.skillRating, avgLoserRating, true);
      updatePromises.push(
        updatePlayerStats(winner.playerId, {
          matchResult: 'win',
          newRating,
          matchId
        })
      );
    }
    
    // Update losers
    for (const loser of losers) {
      const newRating = updateSkillRating(loser.skillRating, avgWinnerRating, false);
      updatePromises.push(
        updatePlayerStats(loser.playerId, {
          matchResult: 'loss',
          newRating,
          matchId
        })
      );
    }
    
    await Promise.all(updatePromises);
    
    // Update match status
    match.status = 'COMPLETED';
    match.endedAt = Date.now();
    match.winningTeam = body.winningTeam;
    match.duration = match.endedAt - match.startedAt;
    
    await dynamodb.put({
      TableName: process.env.MATCHES_TABLE,
      Item: match
    }).promise();
    
    // Clean up lobby if exists
    if (match.lobbyId) {
      await dynamodb.delete({
        TableName: process.env.LOBBIES_TABLE,
        Key: { lobbyId: match.lobbyId }
      }).promise();
    }
    
    return createResponse(200, {
      message: 'Match ended successfully',
      results: {
        matchId,
        winningTeam: body.winningTeam,
        duration: match.duration,
        winners: winners.map(p => ({ playerId: p.playerId, username: p.username })),
        losers: losers.map(p => ({ playerId: p.playerId, username: p.username }))
      }
    });
  } catch (error) {
    console.error('Error ending match:', error);
    return createResponse(500, {
      message: 'Failed to end match',
      error: error.message
    });
  }
};

async function updatePlayerStats(playerId, { matchResult, newRating, matchId }) {
  const player = await dynamodb.get({
    TableName: process.env.PLAYERS_TABLE,
    Key: { playerId }
  }).promise();
  
  if (!player.Item) {
    throw new Error(`Player ${playerId} not found`);
  }
  
  const won = matchResult === 'win';
  const wins = player.Item.wins + (won ? 1 : 0);
  const losses = player.Item.losses + (won ? 0 : 1);
  const matchesPlayed = player.Item.matchesPlayed + 1;
  const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
  
  await dynamodb.update({
    TableName: process.env.PLAYERS_TABLE,
    Key: { playerId },
    UpdateExpression: 'SET skillRating = :rating, wins = :wins, losses = :losses, ' +
                     'matchesPlayed = :matches, winRate = :winRate, updatedAt = :timestamp, ' +
                     'lastMatchId = :matchId',
    ExpressionAttributeValues: {
      ':rating': newRating,
      ':wins': wins,
      ':losses': losses,
      ':matches': matchesPlayed,
      ':winRate': Math.round(winRate * 100) / 100,
      ':timestamp': Date.now(),
      ':matchId': matchId
    }
  }).promise();
}