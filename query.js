var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit: 10,
 	host     : 'localhost',
 	user     : 'root',
 	password : '1111',
	database : 'my_db'
});
 
var query = function(sql,post,callback){
	pool.getConnection(function(err,connection){
		if (err){
			callback(err,null,null);
		}else{
			connection.query(sql,post,function(error,results,fields){
				connection.release();
				callback(error,results,fields);
			});
		}
	});
};

/*pool.on('acquire',function(connection){
	console.log('Connection %d acquired',connection.threadId);
});*/

module.exports=query;