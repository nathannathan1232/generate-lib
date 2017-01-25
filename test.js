'use strict';

const Bob = require('./lib2.js');
const fs = require('fs');


/*
	Learns from movie lines and generates english-like words.
*/

var word_gen = new Bob({
	after_nodes: 5, // 3 is default, but 5 seems to work better for words
	first_nodes: 1, // We only need 1 for this. Default is 2
});

// Load file
var lines = fs.readFileSync('./resources/movie_lines.txt')
	.toString()
	.replace(/[^a-z ]/ig, "") // Replace everything but letters and spaces
	.toLowerCase()
	.split(" ")
	.slice(0, 1500); // Learn the first 1500 words. Feel free to increase limit.

// This function automatically iterates through all the items and learns from them
word_gen.learnFromArray(lines, "");

// Finally, generate some words!
for(var i = 0; i < 5; i++)
	console.log(word_gen.generate().join(""));

/*
	Normally you would give the generate function an input parameter.
	In this example, we're just generating single words so it doesn't matter much.
	If you did give it an input word, it would likely generate a word that seems like it would
	go after the input word if it were part of a sentence.
*/


/*
	Generates math problems.
*/

var math_gen = new Bob({
	after_nodes: 8,
	related_nodes: 1,
});

var equations = fs.readFileSync('./resources/math_equations.txt')
	.toString()
	.split('\n')
	.slice(0, 15000); // Limit to 15000

math_gen.learnFromArray(equations, '');

for(var i = 0; i < 5; i++)
	console.log(math_gen.generate().join(''))

/*
	Generates english sentences.
*/

var sentence_gen = new Bob({});

var sentences = fs.readFileSync('./resources/movie_lines.txt')
	.toString()
	.replace(/  *|\t/ig, " ")
	.split("\n")
	.slice(0, 15000);

sentence_gen.learnFromArray(sentences, ' ');

/*  The output message should make sense as a
	response to whatever you put as the input */
for(var i = 0; i < 5; i++)
	console.log(sentence_gen.generate('Why?').join(' '))