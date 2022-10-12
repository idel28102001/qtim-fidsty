import { Test, TestingModule } from '@nestjs/testing';
import {ClassSerializerInterceptor,  INestApplication,  ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {Reflector} from "@nestjs/core";
import {UserRole } from "../src/users/enums/user.role.enum";

describe('test fidsty app', () => {
    jest.setTimeout(30000);
    let app: INestApplication;
    let body: any;
    let reqMy: any;
    let res: any;
    let fileId: number;
    let postID: string;
    const bot = {
        "id" : "",
        "name" : "fidstyTestBot"
    };
    const admin = {
        "email": "skth47@list.ru",
        "password": "Sder1234!",
        "token": ""
    };
    const owner = {
        "id": null,
        "email": "hamster123789@yandex.ru",
        "password": "Sder1234!",
        "token": ""
    };
    const manager = {
        "id": null,
        "email": "hamhb777@gmail.com",
        "password": "Sder1234!",
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();

        app = moduleFixture.createNestApplication<INestApplication>()
        app.useGlobalPipes(new ValidationPipe());
        app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
        await app.init();
        reqMy = request(app.getHttpServer());
    });
    afterAll(()=>{
        app.close();
    });

    it('login as admin', async ()=>{
        res = await reqMy
            .post('/auth/login')
            .send({
                "email": admin.email,
                "password": admin.password
            });
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toEqual(expect.any(String));
        admin.token = res.body.accessToken;
    });

    it('login as owner', async ()=>{
        res = await reqMy
            .post('/auth/login')
            .send({
                "email": owner.email,
                "password": owner.password
            });
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toEqual(expect.any(String));
        owner.token = res.body.accessToken;
        owner.id = res.body.userId;
    });


    //------------------------------- USERS ------------------------\\
    it('should return users/profile', async () => {
        res = await reqMy
            .get('/users/profile')
            .set('Authorization',`Bearer ${owner.token}` );
        expect(res.status).toBe(200);
        body = res.body;
        expect(body.id).not.toBeUndefined();
        expect(body.id).toEqual(expect.any(Number));
        expect(body.createdAt).toEqual(expect.any(String));
        expect(body.email).toEqual(expect.any(String));
        expect(body.phoneNumber).toEqual(expect.any(String));
        expect(body.freezing).toEqual(false);
        expect(body.registrationStatus).toEqual("ACTIVE");
        expect(Object.values(UserRole)).toContainEqual(body.role);
    });

    it('should return all users', async ()=>{
       res = await reqMy
           .get('/users')
           .set('Authorization',`Bearer ${admin.token}` );
       body = res.body;
       expect(res.status).toBe(200);

       expect(body.bots).toEqual(expect.any(Object));
       expect(body.bots).not.toBe(null);
       expect(body.bots).not.toBeUndefined();

       expect(body.managers).toEqual(expect.any(Object));
       expect(body.managers).not.toBe(null);
       expect(body.managers).not.toBeUndefined();

    });

    it('should return content at owner', async ()=>{
        res = await reqMy
            .get('/users/owner-content/'+owner.id)
            .set('Authorization',`Bearer ${admin.token}` );
        body = res.body.bots.filter(bots => bots.name == bot.name)[0];
        expect(res.status).toBe(200);

        expect(body.id).toEqual(expect.any(Number));
        expect(body.name).toEqual(expect.any(String));
        expect(body.username).toEqual(expect.any(String));
        expect(body.token).toEqual(expect.any(String));
        expect(body.status).toEqual(expect.any(String));

        expect(body.posts).toEqual(expect.any(Object));
        expect(body.posts).not.toBe(null);
        expect(body.posts).not.toBeUndefined();

        expect(body.subscribers).toEqual(expect.any(Object));
        expect(body.subscribers).not.toBe(null);
        expect(body.subscribers).not.toBeUndefined();
    });

    it('should return managers', async ()=> {
        res  = await reqMy
            .get('/users/managers')
            .set('Authorization',`Bearer ${owner.token}` );
        body = res.body[0];
        manager.id = body.id;
        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(body.id).toEqual(expect.any(Number));
        expect(body.role).toEqual("manager");
        expect(body.managerForBots).toEqual(expect.any(Object));
    });

    it('shold return manager by id', async ()=>{
        res  = await reqMy
            .get('/users/manager/'+manager.id)
            .set('Authorization',`Bearer ${admin.token}` );
        body = res.body;
        manager.id = body.id;
        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(body.id).toEqual(expect.any(Number));
        expect(body.role).toEqual("manager");
        expect(body.managerForBots).toEqual(expect.any(Object));
    });

    it('uploads verified file users', async()=>{
        res = await reqMy
            .post('/users/upload-verify-files')
            .set('Authorization',`Bearer ${owner.token}` )
            .attach('files', `${__dirname}/verify-files/test.png`);
        expect(res.status).toBe(201);
        fileId = res.body.verificationFiles[0].id;
    });

    it('delete verify users file', async ()=>{
        res = await reqMy
            .delete(`/media/${fileId}`)
            .set('Authorization',`Bearer ${owner.token}` );
        expect(res.status).toBe(200);
    });

    it('edit user information', async ()=>{
        res = await reqMy
            .put('/users/update-profile')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "name":"test_name - "+new Date().getDate().toString(),
                "surname":"test_surname - "+new Date().getMonth().toString(),
                "country":"Tula - "+new Date().getFullYear().toString(),
                "dateOfBirth": new Date('1996-08-20').toISOString()
            });
        expect(res.status).toBe(200);
    });

    it('should change verification status to verified', async ()=>{
        res = await reqMy
            .post(`/users/change-verification-status/${owner.id}`)
            .set('Authorization',`Bearer ${admin.token}`)
            .send({
                'status':'VERIFIED'
            });
        body = res.body;
        expect(res.status).toBe(201);
        expect(body.id).toBe(owner.id);
        expect(body.verificationStatus).toBe('VERIFIED');
    });

    it('should change verification status to NOT_CONFIRMED', async ()=>{
        res = await reqMy
            .post(`/users/change-verification-status/${owner.id}`)
            .set('Authorization',`Bearer ${admin.token}`)
            .send({
                'status':'NOT_CONFIRMED'
            });
        body = res.body;
        expect(res.status).toBe(201);
        expect(body.id).toBe(owner.id);
        expect(body.verificationStatus).toBe('NOT_CONFIRMED');
    });

    it('should freezing owner', async ()=>{
        res = await reqMy
            .post(`/users/freezing/${owner.id}`)
            .set('Authorization',`Bearer ${admin.token}`)
            .send({
                'freezing':true
            });
        body = res.body;
        expect(res.status).toBe(201);
        expect(body.id).toBe(owner.id);
        expect(body.freezing).toBe(true);
    });

    it('checking freezing manager at owner', async ()=>{
        res = await reqMy
            .post('/auth/login')
            .send({
                "email": manager.email,
                "password": manager.password
            });
        body = res.body;
        expect(res.status).toBe(403);
        expect(body.message).toBe("The user is temporarily frozen");
    });

    it('checking freezing owner', async ()=>{
        res = await reqMy
            .post('/auth/login')
            .send({
                "email": owner.email,
                "password": owner.password
            });
        body = res.body;
        expect(res.status).toBe(403);
        expect(body.message).toBe("The user is temporarily frozen");
    });

    it('should unfreezing owner', async ()=>{
        res = await reqMy
            .post(`/users/freezing/${owner.id}`)
            .set('Authorization',`Bearer ${admin.token}`)
            .send({
                'freezing':false
            });
        body = res.body;
        expect(res.status).toBe(201);
        expect(body.id).toBe(owner.id);
        expect(body.freezing).toBe(false);
    });

    it('checking freezing manager at owner', async ()=>{
        res = await reqMy
            .post('/auth/login')
            .send({
                "email": manager.email,
                "password": manager.password
            });
        body = res.body;
        expect(res.status).toBe(200);

    });

    it('checking freezing owner', async ()=>{
        res = await reqMy
            .post('/auth/login')
            .send({
                "email": owner.email,
                "password": owner.password
            });
        body = res.body;
        expect(res.status).toBe(200);
    });

    it('changed password', async ()=>{
        res = await reqMy
            .post('/users/change-password')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "oldPassword": owner.password,
                "newPassword": "1234567890"
            });
        expect(res.status).toBe(201);

        res = await reqMy
            .post('/auth/login')
            .send({
                "email": owner.email,
                "password": "1234567890"
            });
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toEqual(expect.any(String));
        expect(res.body.userId).toBe(owner.id);

        res = await reqMy
            .post('/users/change-password')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "oldPassword": "1234567890",
                "newPassword": owner.password
            });
        expect(res.status).toBe(201);
    })

    it('upload user avatar', async ()=>{
        res = await reqMy
            .post(`/users/${owner.id}/photo`)
            .set('Authorization',`Bearer ${owner.token}`)
            .attach('file', `${__dirname}/verify-files/test.png`);
        expect(res.status).toBe(201);
    });
    //------------------------------- USERS END ------------------------\\


    //------------------------------- BOT -------------------------\\
    it('get bot', async ()=>{
        res = await reqMy
            .get('/bots/list')
            .set('Authorization',`Bearer ${owner.token}`);
        expect(res.status).toBe(200);
        body = res.body.filter(bots => bots.name == bot.name)[0];
        expect(body.id).toEqual(expect.any(Number));

        bot.id = body.id.toString();

        expect(body.name).toEqual(expect.any(String));
        expect(body.username).toEqual(expect.any(String));
        expect(body.token).toEqual(expect.any(String));
        expect(body.status).toEqual("ACTIVATED");
        expect(body.owner).toEqual(expect.any(Object));
        expect(body.owner.id).not.toBeUndefined();
        expect(body.subscribers).toEqual(expect.any(Object))
    });

    it('get bot by id', async ()=>{
        res = await reqMy
            .get('/bots/'+bot.id)
            .set('Authorization',`Bearer ${owner.token}`);
        expect(res.status).toBe(200);
        body = res.body;
        expect(body.id.toString()).toBe(bot.id);
        expect(body.createdAt).toEqual(expect.any(String))
        expect(body.createdAt).not.toBeNull()
        expect(body.name).toBe(bot.name)
    });

    it('set primary status bot', async ()=>{
        res = await reqMy
            .post('/bots/primary/'+bot.id)
            .set('Authorization',`Bearer ${owner.token}`);
        body = res.body;
        expect(res.status).toBe(201);
        expect(body.id.toString()).toBe(bot.id);
    });

    it('change name bot', async ()=>{
       res = await reqMy
           .put('/bots/'+bot.id)
           .set('Authorization',`Bearer ${owner.token}`)
           .send({
               "name" : bot.name + "_1"
           });
       expect(res.status).toBe(200);
    });

    it('return name bot', async ()=>{
        res = await reqMy
            .put('/bots/'+bot.id)
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "name" : bot.name
            });
        expect(res.status).toBe(200);
    });

    it('bot deactivated', async ()=>{
        res = await reqMy
            .post('/bots/bot-status/'+bot.id)
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "status": "DEACTIVATED"
            });
        expect(res.status).toBe(201);
        body = res.body;
        expect(body.id.toString()).toBe(bot.id);
        expect(body.status).toBe("DEACTIVATED");
    });

    it('dont send post from deactivated bot', async ()=>{
        res = await reqMy
            .post('/posts')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "botId": bot.id,
                "title": "testbot",
                "previewText": "fromautotest -:- " + new Date().toISOString(),
                "timePublic": "",
                "cost": "",
                "datePublic": (new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000))).toISOString().slice(0, -1),
                "description": "strong description"
            })
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Bot is deactivated");
    });

    it('bot activated', async ()=>{
        res = await reqMy
            .post('/bots/bot-status/'+bot.id)
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "status": "ACTIVATED"
            });
        expect(res.status).toBe(201);
        body = res.body;
        expect(body.id.toString()).toBe(bot.id);
        expect(body.status).toBe("ACTIVATED");
    });
    //------------------------------- BOT END -------------------------\\


    //------------------------------- SUBSCRIBERS -------------------------\\
    it('get subscribes for bot', async ()=>{
        res = await reqMy
            .get('/subscribers')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "botId": bot.id
            });
        expect(res.status).toBe(200);
        body = res.body[0];
        expect(body.id).toEqual(expect.any(Number));
        expect(body.chatId).toEqual(expect.any(Number));
        expect(body.username).toEqual((expect.any(String)));
    });
    //------------------------------- SUBSCRIBERS END -------------------------\\


    //------------------------------- POST ------------------------\\
    it('post create', async ()=>{

        res = await reqMy
            .post('/posts')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "botId": bot.id,
                "title": "testbot",
                "previewText": "fromautotest -:- " + new Date().toISOString(),
                "timePublic": "",
                "cost": "",
                "datePublic": (new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000))).toISOString().slice(0, -1),
                "description": "strong description"
            })
        body = res.body;
        expect(res.status).toBe(201);
        expect(body.id).toEqual(expect.any(Number));
        expect(body.title).toEqual(expect.any(String));
        expect(body.previewText).toEqual(expect.any(String));
        expect(body.botId).toBe(bot.id);
        postID = body.id;
        await new Promise(res1 => setTimeout(res1, 3500));
    }, );

    it('get posts', async ()=>{
        res = await reqMy
            .get('/posts/list')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "botId": bot.id,
                "dayPublic": new Date().toISOString().split('T')[0]
            });
        expect(res.status).toBe(200);
        body = res.body.filter(post => post.id == postID)[0];
        expect(body.id).not.toBeUndefined();
        expect(body.id).toEqual(expect.any(Number));
        expect(body.title).toEqual(expect.any(String));
        expect(body.previewText).toEqual(expect.any(String));
        expect(body.dayPublic).toBe(new Date().toISOString().split('T')[0]);
        expect(body.bot.id.toString()).toBe(bot.id);
    });

    it('get post count', async ()=>{
        res = await reqMy
            .get('/posts/count')
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "botId": bot.id,
                "publicAt": new Date(new Date().setDate(new Date().getDate()-1)).toISOString().split('T')[0].toString(),
                "publicTo": new Date(new Date().setDate(new Date().getDate()+1)).toISOString().split('T')[0].toString()
            });
        body = res.body;
        expect(res.status).toBe(200);
        expect(body).not.toBeUndefined();
        expect(body[new Date().toISOString().split('T')[0]]).not.toBe(0);
    });

    it('edit post', async ()=>{
        res = await reqMy
            .put('/posts/'+postID)
            .set('Authorization',`Bearer ${owner.token}`)
            .send({
                "title": "this edit post",
                "previewText": "12321",
                "description": "edit post",
                "datePublic": (new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000))).toISOString().slice(0, -1),
                "cost": ""
            });
        body = res.body;
        expect(res.status).toBe(200);
        expect(body.id).not.toBeUndefined();
        expect(body.id).toEqual(postID);
        expect(body.title).toEqual(expect.any(String));
        expect(body.previewText).toEqual(expect.any(String));
        expect(body.bot).toEqual(expect.any(Object));
        expect(body.bot.id.toString()).toBe(bot.id);
        await new Promise(res1 => setTimeout(res1, 4500));
    });

    it('get post by id', async ()=>{
        res = await reqMy
            .get('/posts/'+postID)
            .set('Authorization',`Bearer ${owner.token}`)
        body = res.body;
        expect(res.status).toBe(200);
        expect(body.id).toEqual(expect.any(Number));
        expect(body.title).toEqual(expect.any(String));
        expect(body.previewText).toEqual(expect.any(String));
        expect(body.bot.id.toString()).toBe(bot.id);
    });

    it('delete post', async ()=>{
        res = await reqMy
            .del('/posts/'+postID)
            .set('Authorization',`Bearer ${owner.token}`);
        expect(res.status).toBe(200);
    });
    //------------------------------- POST END ------------------------\\


    it('logout admin', async ()=>{
        res = await reqMy
            .post('/auth/logout')
            .set('Authorization',`Bearer ${admin.token}`);
        expect(res.status).toBe(200);
        // this is will work after push FS-169
        // res = await reqMy
        //     .get('/users/profile')
        //     .set('Authorization',`Bearer ${admin.token}`);
        // expect(res.status).toBe(403);
    });
    it('logout owner', async ()=>{
        res = await reqMy
            .post('/auth/logout')
            .set('Authorization',`Bearer ${owner.token}`);
        expect(res.status).toBe(200);
        // this is will work after push FS-169
        // res = await reqMy
        //     .get('/users/profile')
        //     .set('Authorization',`Bearer ${owner.token}`);
        // expect(res.status).toBe(403);
    });
});
