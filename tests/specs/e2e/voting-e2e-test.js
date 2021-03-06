var request = require('request');
var pg = require('pg');

describe('Integration tests - voting', function () {

  var appHost = 'localhost:5000';
  var dbHost = 'localhost';
  if (process.env.appHost) {
    appHost = process.env.appHost;
  }
  if (process.env.dbHost) {
    dbHost = process.env.dbHost
  }

  var votesA = 0, votesB = 0;

  var t = new Date().getTime();
  var willVote = 'a';
  if (t % 2 == 0) {
    willVote = 'b';
  }
  console.log('Will vote: ' + willVote);

  beforeEach(function (done) {
    setTimeout(function () {
      done();
    }, 1000);
  });

  it('check database before voting', function (done) {
    console.log('dbHost: ' + dbHost);
    pg.connect('postgres://postgres@' + dbHost + '/postgres').then(function (client) {
      client.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote', [], function (errrr, result) {
        if (errrr) {
          console.error("Error performing query: " + errrr);
        } else {
          result.rows.forEach(function (row) {
            if (row.vote === 'a') {
              votesA = row.count;
            } else if (row.vote === 'b') {
              votesB = row.count;
            }
          }, result);
//          console.log('before - votesA: ' + votesA);
//          console.log('before - votesB: ' + votesB);
          done();
        }
      });
    }, function (err) {
      console.log('error: ' + err);
    });
  });

  it('vote cats and verify', function (done) {
    var options = {
      url: 'http://' + appHost,
      method: 'POST',
      formData: {
        vote: willVote
      }
    };
    request(options, function (error, resp, body) {
      expect(resp.statusCode).equal(200);
      var ind = body.indexOf('var vote');
      expect(ind).to.be.above(-1);
      var votedA = body.substring(ind, ind + 15).indexOf('= "a"');
      var votedB = body.substring(ind, ind + 15).indexOf('= "b"');
      if(willVote==='a'){
        expect(votedA).to.be.above(1);
        expect(votedB).equal(-1);
      } else {
        expect(votedA).equal(-1);
        expect(votedB).to.be.above(1);
      }

      done();
    })
  });


  it('check database after voting', function (done) {
    var voteA = 0;
    var voteB = 0;
    pg.connect('postgres://postgres@' + dbHost + '/postgres').then(function (client) {
      client.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote', [], function (errrr, result) {
        if (errrr) {
          console.error("Error performing query: " + errrr);
        } else {
          result.rows.forEach(function (row) {
            if (row.vote === 'a') {
              voteA = row.count;
            } else if (row.vote === 'b') {
              voteB = row.count;
            }
          }, result);

          console.log('voteA=' + voteA);
          console.log('votesA=' + votesA);
          console.log('voteB=' + voteB);
          console.log('votesB=' + votesB);
          if (voteA) {
            if(willVote==='a'){
              expect(voteA - votesA).equal(1);
            } else {
              expect(voteA - votesA).equal(0);
            }
          }
          if (voteB) {
            if(willVote==='b'){
              expect(voteB - votesB).equal(1);
            } else {
              expect(voteB - votesB).equal(0);
            }
          }
          done();
        }
      });
    }, function (err) {
      console.log('error');
    });
  });

});
