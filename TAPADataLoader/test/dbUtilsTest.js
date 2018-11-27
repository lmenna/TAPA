import "@babel/polyfill";
import {assert, expect} from "chai";
import { MongoClient } from 'mongodb';
import {getMostRecentETHData} from "../src/utils/dbUtils";

describe("MongoDB see if recent data can be queried", function(){
  it("should return some data", async function() {
    var result = await getMostRecentETHData();
    assert.isAtLeast(result[0].data.length, 1);
  });
});
