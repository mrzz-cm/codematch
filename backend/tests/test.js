const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app.js');

chai.use(chaiHttp);
chai.should();

describe("API", () => {
    describe("GET /api/v1.0", () => {
        // Test dummy
        it("should return API", (done) => {
            chai.request(app)
                .get('/api/v1.0')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('title').eql('API');
                    done();
                });
        });
    });
});