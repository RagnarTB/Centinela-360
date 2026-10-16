package com.centinela360.service;

import com.centinela360.controller.dto.CreateNewsRequest;
import com.centinela360.controller.dto.NewsResponse;
import com.centinela360.domain.News;
import com.centinela360.repository.NewsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NewsServiceTest {

    @Mock
    private NewsRepository newsRepository;

    private NewsService newsService;

    @BeforeEach
    void setUp() {
        newsService = new NewsService(newsRepository);
    }

    @Test
    void shouldCreateNewsSuccessfully() {
        CreateNewsRequest request = new CreateNewsRequest(
                "Operativo de Seguridad en Mercado Modelo",
                "Patrullaje integrado Serenazgo-PNP en el centro de Chiclayo.",
                "OFICIAL"
        );

        News saved = News.builder()
                .id(UUID.randomUUID())
                .title(request.title())
                .body(request.body())
                .tag("OFICIAL")
                .publishedAt(OffsetDateTime.now())
                .build();

        when(newsRepository.save(any(News.class))).thenReturn(Mono.just(saved));

        StepVerifier.create(newsService.createNews(request))
                .assertNext((NewsResponse res) -> {
                    org.junit.jupiter.api.Assertions.assertEquals(request.title(), res.title());
                    org.junit.jupiter.api.Assertions.assertEquals("OFICIAL", res.tag());
                })
                .verifyComplete();
    }

    @Test
    void shouldListAllNewsDescending() {
        News n1 = News.builder().id(UUID.randomUUID()).title("Noticia 1").tag("PREVENTIVO").publishedAt(OffsetDateTime.now()).build();
        when(newsRepository.findAllOrderByPublishedAtDesc()).thenReturn(Flux.just(n1));

        StepVerifier.create(newsService.getAllNews())
                .expectNextCount(1)
                .verifyComplete();
    }
}
