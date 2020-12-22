var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var template = require('./lib/template.js');

var app = http.createServer(function(request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    var title = queryData.id;

    // 정상 접근시 출력되는 화면
    if (pathname === '/') {
        // 메인페이지 화면
        if (title === undefined) {
            fs.readdir('./data', (error, filelist) => {
                var title = 'Wellcome';
                var description = 'Hello, Node.js';
                var list = template.list(filelist);
                var html = template.html(
                    title, list,
                    `<h2>${title}</h2><p>${description}</p>`,
                    `<a href="/create">create</a>`
                );
                response.writeHead(200); // 정상적으로 파일을 전송했다는 뜻 :: 200
                response.end(html);
            });
        }
        // 목차페이지 화면
        else {
            fs.readdir('./data', (error, filelist) => {
                var filteredId = path.parse(queryData.id).base; // 보안 :: filteredId
                fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
                    var sanitizedTitle = sanitizeHtml(title);
                    var sanitizedDescription = sanitizeHtml(description, {
                        allowedTags: ['h1']
                    });
                    var list = template.list(filelist);
                    var html = template.html(
                        title, list,
                        `<h2>${sanitizedTitle}</h2><p>${sanitizedDescription}</p>`,
                        ` <a href="/create">create</a>
                  <a href="/update?id=${sanitizedTitle}">update</a>
                  <form action="delete_process" method="post">
                    <input type="hidden" name="id" value="${sanitizedTitle}">
                    <input type="submit" value="delete">
                  </form>
                `
                    );
                    response.writeHead(200); // 정상적으로 파일을 전송했다는 뜻 :: 200
                    response.end(html);
                });
            })
        };
    }
    // CREAT 
    // create 클릭시 나타나는 Form
    else if (pathname === '/create') {
        fs.readdir('./data', (error, filelist) => {
            var title = 'WEB - create';
            var list = template.list(filelist);
            var html = template.html(title, list, `
        <form action="/create_process" method="POST">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `, '');
            response.writeHead(200); // 정상적으로 파일을 전송했다는 뜻 :: 200
            response.end(html);
        });
    }
    // create form에서 data가 제출 되었을때
    else if (pathname === '/create_process') {
        var body = '';
        request.on('data', function(data) { // 데이터를 조각내서 전송
            body += data;
        });
        // 데이터 생성 완료시
        request.on('end', function() {
            var post = qs.parse(body);
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
                response.writeHead(302, {
                    Location: `/?id=${title}`
                }); // redirection 사용자를 다른 페이지로 보내라는 뜻 :: 302
                response.end();
            })
        });
    }
    // UPDATE Part.
    // update 클릭시 나타나는 Form
    else if (pathname === '/update') {
        fs.readdir('./data', (error, filelist) => {
            var filteredId = path.parse(queryData.id).base; // 보안 :: filteredId
            fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
                var list = template.list(filelist);
                var html = template.html(title, list,
                    `
            <form action="/update_process" method="POST">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
                    `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
                );
                response.writeHead(200); // 정상적으로 파일을 전송했다는 뜻 :: 200
                response.end(html);
            });
        })
    }
    // update form에서 data가 수정 되었을때
    else if (pathname === '/update_process') {
        var body = '';
        request.on('data', function(data) { // 데이터를 조각내서 전송
            body += data;
        });
        // 데이터 수정 완료시
        request.on('end', function() {
            var post = qs.parse(body);
            var id = post.id;
            var title = post.title;
            var description = post.description;
            fs.rename(`data/${id}`, `data/${title}`, function(error) {
                fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
                    response.writeHead(302, {
                        Location: `/?id=${title}`
                    }); // redirection 사용자를 다른 페이지로 보내라는 뜻 :: 302
                    response.end();
                })
            })
        });
    }
    // DELETE
    else if (pathname === '/delete_process') {
        var body = '';
        request.on('data', function(data) { // 데이터를 조각내서 전송
            body += data;
        });
        // 데이터 삭제 완료시
        request.on('end', function() {
            var post = qs.parse(body);
            var id = post.id;
            var filteredId = path.parse(id).base; // 보안 :: filteredId
            fs.unlink(`data/${filteredId}`, function(error) {
                response.writeHead(302, {
                    Location: `/`
                }); // redirection 사용자를 다른 페이지로 보내라는 뜻 :: 302
                response.end();
            })
        });
    }
    // 오류페이지 404 NotFound 페이지
    else {
        response.writeHead(404); // 정상적으로 파일을 전송하지 못했다는 뜻 :: 404
        response.end('Not found');
    };
});
// 포트번호 (http의 기본값 = 80)
app.listen(3000);