const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

async function setupDatabase() {
  console.log('Setting up DynamoDB tables...');
  
  try {
    // Check if tables exist
    const tables = await dynamodb.listTables().promise();
    console.log('Existing tables:', tables.TableNames);
    
    // Create sample data
    const docClient = new AWS.DynamoDB.DocumentClient();
    
    // Create sample players
    const samplePlayers = [
      {
        playerId: 'player-demo-1',
        username: 'DemoPlayer1',
        region: 'us-east-1',
        skillRating: 1200,
        wins: 5,
        losses: 3,
        matchesPlayed: 8,
        winRate: 62.5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'ONLINE'
      },
      {
        playerId: 'player-demo-2',
        username: 'DemoPlayer2',
        region: 'us-east-1',
        skillRating: 1350,
        wins: 10,
        losses: 5,
        matchesPlayed: 15,
        winRate: 66.67,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'ONLINE'
      },
      {
        playerId: 'player-demo-3',
        username: 'DemoPlayer3',
        region: 'eu-west-1',
        skillRating: 950,
        wins: 2,
        losses: 8,
        matchesPlayed: 10,
        winRate: 20,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'ONLINE'
      }
    ];
    
    // Insert sample players
    for (const player of samplePlayers) {
      await docClient.put({
        TableName: process.env.PLAYERS_TABLE || 'matchmaking-as-a-service-players-dev',
        Item: player
      }).promise();
      console.log(`Created player: ${player.username}`);
    }
    
    console.log('Database setup complete!');
    console.log('\nSample player IDs for testing:');
    samplePlayers.forEach(p => {
      console.log(`- ${p.playerId} (${p.username}, Rating: ${p.skillRating})`);
    });
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();