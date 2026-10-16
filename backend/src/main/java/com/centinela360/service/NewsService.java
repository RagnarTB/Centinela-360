package com.centinela360.service;

import com.centinela360.controller.dto.CreateNewsRequest;
import com.centinela360.controller.dto.NewsResponse;
import com.centinela360.domain.News;
import com.centinela360.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;

    public Flux<NewsResponse> getAllNews() {
        return newsRepository.findAllOrderByPublishedAtDesc()
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> createNews(CreateNewsRequest request) {
        News news = News.builder()
                .title(request.title())
                .body(request.body())
                .tag(request.tag().toUpperCase())
                .publishedAt(OffsetDateTime.now())
                .build();

        return newsRepository.save(news)
                .map(NewsResponse::from);
    }
}
